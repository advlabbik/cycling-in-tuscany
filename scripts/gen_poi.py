# -*- coding: utf-8 -*-
"""Genera traccia + POI (acqua / mangiare / borghi) di un itinerario da GPX +
OpenStreetMap e scrive public/data/itinerari/<slug>.json, il file che il
RouteViewer carica.

Porting di scripts/gen_poi.py di advlabbik/tg-guida (12 ago 2026), che contiene
le trappole gia' pagate care — LEGGERE docs/generazione-poi.md di quel repo
prima di "migliorare" qualcosa qui. Differenze rispetto all'originale:

- output: un JSON per slug con {slug, kmTot, points:[[lat,lng,ele,km]...], poi}
  invece di poi.js cumulativo; le liste di revisione umana in docs/liste-poi/.
- etichette in inglese (il sito e' EN-only).
- REGOLA PARTNER (Andrea, 14/8): sugli itinerari legati a una scheda a
  pagamento non compaiono alloggi concorrenti. Per gli slug in PARTNER la
  categoria "dormire" (d) viene SCARTATA, i conteggi alloggi dei centri
  azzerati, e viene iniettato il solo POI del partner.

USO (dalla radice del repo):
    python scripts/gen_poi.py vt-gravel-1="C:/tracce/g1.gpx" vt-road-1="..."

La cache OSM (_osm_<slug>.json) evita di riscaricare: cancellarla per rifare.
"""
import json, math, os, sys, time, urllib.parse, urllib.request, xml.etree.ElementTree as ET

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTDIR = os.path.join(REPO, "public", "data", "itinerari")
MD_DIR = os.path.join(REPO, "docs", "liste-poi")
CACHE_DIR = os.path.join(REPO, "scripts")
os.makedirs(MD_DIR, exist_ok=True)
os.makedirs(OUTDIR, exist_ok=True)

# Il partner della scheda, iniettato come unico "dormire" sui suoi itinerari.
# Le coordinate sono il punto di partenza dei GPX (= la porta della struttura).
PARTNER = {
    "vt-": {"t": "d", "name": "Villa Toscana",
            "desc": "Your base — Official Bike-Friendly Stay",
            "lat": 42.99, "lng": 10.606, "partner": True,
            "url": "https://www.villatoscanavacanze.it/"},
    "pacr-": {"t": "d", "name": "PuntAla Camp & Resort",
              "desc": "Your base — Official Bike-Friendly Stay",
              "lat": 42.8433, "lng": 10.7796, "partner": True,
              "url": "https://www.campingpuntala.it/"},
    "vo-": {"t": "d", "name": "Villaggio Orizzonte",
            "desc": "Your base — Official Bike-Friendly Stay",
            "lat": 42.966, "lng": 10.6264, "partner": True,
            "url": "https://www.villaggioorizzonte.it/"},
}

GPX = {}
for arg in sys.argv[1:]:
    if "=" not in arg:
        sys.exit(f"argomento non valido: {arg} (atteso slug=file.gpx)")
    k, v = arg.split("=", 1)
    if not os.path.exists(v):
        sys.exit(f"file non trovato: {v}")
    GPX[k] = v
if not GPX:
    sys.exit(__doc__)

BUF_POI, BUF_WATER, BUF_PLACE, SOGLIA = 500, 300, 2500, 4
PASSO = 0.7          # km fra i punti del corridoio: 700 m < 2x500 m di buffer (trappola 1)
CHUNK = 22
CANDIDATI = ["https://overpass-api.de/api/interpreter",
             "https://overpass.kumi.systems/api/interpreter"]
ENDPOINTS = []
RAGGIO = {"city": 4000, "town": 2500, "village": 1200, "hamlet": 700}
RANGO = {"city": 4, "town": 3, "village": 2, "hamlet": 1}
EAT = {"restaurant": "restaurant", "cafe": "cafe", "bar": "bar", "fast_food": "fast food",
       "pub": "pub", "ice_cream": "gelateria", "supermarket": "supermarket",
       "convenience": "grocery", "bakery": "bakery"}
SLEEP = {"hotel": "hotel", "guest_house": "B&B", "hostel": "hostel", "motel": "motel",
         "alpine_hut": "mountain hut", "wilderness_hut": "bivouac", "camp_site": "campground",
         "chalet": "chalet", "apartment": "apartments"}


def parse_gpx(path):
    pts = []
    for p in ET.parse(path).getroot().iter("{http://www.topografix.com/GPX/1/1}trkpt"):
        e = p.find("{http://www.topografix.com/GPX/1/1}ele")
        pts.append((float(p.get("lat")), float(p.get("lon")),
                    float(e.text) if e is not None else 0.0))
    return pts


def hav(a, b):
    R = 6371.0
    la1, la2 = math.radians(a[0]), math.radians(b[0])
    h = math.sin((la2-la1)/2)**2 + math.cos(la1)*math.cos(la2)*math.sin(math.radians(b[1]-a[1])/2)**2
    return 2*R*math.asin(math.sqrt(h))


def cumulate(pts):
    c = [0.0]
    for i in range(1, len(pts)):
        c.append(c[-1] + hav(pts[i-1], pts[i]))
    return c


def campiona(pts, cum, passo):
    """Un punto ogni `passo` km di percorso REALE, mai semplificazione
    geometrica (RDP saltava interi paesi sui rettilinei — trappola 1)."""
    out, prossimo = [pts[0]], passo
    for i, k in enumerate(cum):
        if k >= prossimo:
            out.append(pts[i])
            while prossimo <= k:
                prossimo += passo
    if out[-1] != pts[-1]:
        out.append(pts[-1])
    return out


def collauda_endpoint(lat, lon):
    """Tiene solo i server che COPRONO la zona (i mirror regionali rispondono
    200 OK con zero risultati fuori area e avvelenano i dati — trappola 3)."""
    q = f"[out:json][timeout:25];node[place](around:10000,{lat},{lon});out count;"
    buoni = []
    for ep in CANDIDATI:
        for tentativo in range(3):
            try:
                req = urllib.request.Request(ep, data=("data=" + urllib.parse.quote(q)).encode(),
                                             headers={"User-Agent": "cit-poi"})
                with urllib.request.urlopen(req, timeout=30) as r:
                    d = json.load(r)
                tot = int(d["elements"][0]["tags"]["total"])
                print(f"  {ep.split('/')[2]}: {tot} centri entro 10 km "
                      f"{'-> OK' if tot > 0 else '-> SCARTATO, non copre la zona'}", flush=True)
                if tot > 0:
                    buoni.append(ep)
                break
            except Exception as e:
                if tentativo == 2:
                    print(f"  {ep.split('/')[2]}: non risponde ({e}) -> scartato", flush=True)
                else:
                    time.sleep(10)
    if not buoni:
        sys.exit("Nessun server Overpass utilizzabile ora. Il parziale e' salvato, riprova.")
    return buoni


def query(cs):
    q = f"""[out:json][timeout:120];
(
  nwr[amenity~"^(restaurant|cafe|bar|fast_food|pub|ice_cream)$"](around:{BUF_POI},{cs});
  nwr[shop~"^(supermarket|convenience|bakery)$"](around:{BUF_POI},{cs});
  nwr[tourism~"^(hotel|guest_house|hostel|motel|alpine_hut|wilderness_hut|camp_site|chalet|apartment)$"](around:{BUF_POI},{cs});
  node[amenity=drinking_water](around:{BUF_WATER},{cs});
  node[man_made=water_tap](around:{BUF_WATER},{cs});
  node[place~"^(city|town|village|hamlet)$"](around:{BUF_PLACE},{cs});
);
out center tags;"""
    last = None
    for t in range(12):
        ep = ENDPOINTS[t % len(ENDPOINTS)]
        try:
            req = urllib.request.Request(ep, data=("data=" + urllib.parse.quote(q)).encode(),
                                         headers={"User-Agent": "cit-poi"})
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.load(r)
            # trappola 4: HTTP 200 con dati TRONCATI, avviso solo in "remark"
            remark = data.get("remark", "")
            if remark and ("timed out" in remark or "error" in remark.lower()):
                raise RuntimeError(f"risposta parziale ({remark[:70]})")
            if "elements" not in data:
                raise RuntimeError("risposta senza elements")
            return data["elements"]
        except Exception as e:
            last = e
            print(f"    retry {t+1} ({e})", flush=True)
            time.sleep(8 + t*2)
    raise last


def scarica(key, corr):
    cache = os.path.join(CACHE_DIR, f"_osm_{key}.json")
    if os.path.exists(cache):
        el = json.load(open(cache, encoding="utf-8"))
        print(f"  cache: {len(el)} elementi", flush=True)
        return el
    parz = cache + ".parziale"
    elements, seen, fatti = [], set(), 0
    if os.path.exists(parz):
        d = json.load(open(parz, encoding="utf-8"))
        elements, fatti = d["elements"], d["fatti"]
        seen = {(e["type"], e["id"]) for e in elements}
        print(f"  riprendo dal tratto {fatti+1}", flush=True)
    tratti = list(range(0, len(corr), CHUNK))
    for n, ci in enumerate(tratti):
        if n < fatti:
            continue
        cs = ",".join(f"{a:.4f},{b:.4f}" for a, b, *_ in corr[ci:ci+CHUNK+1])
        print(f"  tratto {n+1}/{len(tratti)}", flush=True)
        for e in query(cs):
            k = (e["type"], e["id"])
            if k not in seen:
                seen.add(k)
                elements.append(e)
        json.dump({"elements": elements, "fatti": n+1}, open(parz, "w", encoding="utf-8"))
        time.sleep(2)
    json.dump(elements, open(cache, "w", encoding="utf-8"))
    os.remove(parz)
    print(f"  scaricati {len(elements)} elementi", flush=True)
    return elements


def elabora(pts2d, cum, elements, partner_route):
    def nearest(p):
        best, bd = 0, float("inf")
        cl = math.cos(math.radians(p[0]))
        for i, s in enumerate(pts2d):
            d = (s[0]-p[0])**2 + ((s[1]-p[1])*cl)**2
            if d < bd:
                bd, best = d, i
        return cum[best], hav(p, pts2d[best])*1000

    pois, places = [], []
    for el in elements:
        t = el.get("tags", {})
        p = (el["lat"], el["lon"]) if "lat" in el else \
            ((el["center"]["lat"], el["center"]["lon"]) if el.get("center") else None)
        if not p:
            continue
        if t.get("amenity") == "drinking_water" or t.get("man_made") == "water_tap":
            cat, sub = "a", "fountain"
        elif t.get("amenity") in EAT or t.get("shop") in EAT:
            cat, sub = "m", EAT.get(t.get("amenity")) or EAT.get(t.get("shop"))
        elif t.get("tourism") in SLEEP:
            if partner_route:      # regola partner: niente alloggi concorrenti
                continue
            cat, sub = "d", SLEEP[t["tourism"]]
        elif t.get("place") in RAGGIO:
            places.append({"nome": t.get("name", "?"), "p": p, "tipo": t["place"]})
            continue
        else:
            continue
        km, dist = nearest(p)
        if dist > (BUF_WATER if cat == "a" else BUF_POI):
            continue
        pois.append({"cat": cat, "sub": sub, "nome": t.get("name", ""), "km": km, "p": p})

    # fontane deduplicate entro 80 m (in piazza spesso ce n'e' piu' d'una mappata)
    fonts = sorted([x for x in pois if x["cat"] == "a"], key=lambda x: x["km"])
    keep = []
    for f in fonts:
        if all(hav(f["p"], g["p"])*1000 > 80 for g in keep):
            keep.append(f)
    pois = [x for x in pois if x["cat"] != "a"] + keep

    for poi in pois:
        best = None
        for pl in places:
            dd = hav(poi["p"], pl["p"])*1000
            if dd <= RAGGIO[pl["tipo"]]:
                cand = (RANGO[pl["tipo"]], -dd, pl["nome"])
                if best is None or cand > best[0]:
                    best = (cand, pl)
        poi["luogo"] = best[1]["nome"] if best else None
        poi["luogo_p"] = best[1]["p"] if best else None

    from collections import defaultdict
    gruppi = defaultdict(lambda: {"m": [], "d": [], "a": [], "p": None})
    solitari = []
    for poi in pois:
        if poi["luogo"]:
            g = gruppi[poi["luogo"]]
            g[poi["cat"]].append(poi)
            g["p"] = poi["luogo_p"]
        else:
            solitari.append(poi)

    entries = []
    for nome, g in gruppi.items():
        ne, ns, nf = len(g["m"]), len(g["d"]), len(g["a"])
        if partner_route:
            ns = 0
        kms = sorted(x["km"] for x in g["m"]+g["d"]+g["a"])
        if ne >= SOGLIA or ns >= SOGLIA:
            e = {"t": "c", "km": round(kms[len(kms)//2], 1), "name": nome,
                 "ne": ne, "ns": ns, "nf": nf}
            if g["p"]:
                e["lat"], e["lng"] = round(g["p"][0], 5), round(g["p"][1], 5)
            entries.append(e)
        else:
            for x in g["m"]+g["d"]+g["a"]:
                x["centro_piccolo"] = nome
                solitari.append(x)
    # I servizi della zona di partenza/arrivo (primo e ultimo km) sono quelli
    # della base stessa: stanno nella scheda della struttura, non nella lista
    # del percorso — senza questo filtro il campeggio riversava 10 righe a
    # km 0 e il gruppo sulla mappa sembrava "10 posti per dormire" (15/8).
    km_tot = cum[-1]
    solitari = [x for x in solitari if 1.0 <= x["km"] <= km_tot - 1.0]
    for x in solitari:
        e = {"t": x["cat"], "km": round(x["km"], 1), "name": x["nome"], "sub": x["sub"]}
        if x.get("centro_piccolo"):
            e["luogo"] = x["centro_piccolo"]
        # come in tg-guida: le coordinate vere restano solo dove servono al
        # bottone Prenota (dormire). Acqua e cibo si appoggiano alla traccia
        # al loro km — i punti OSM grezzi possono stare fino a 500 m dal
        # percorso e sulla mappa finivano in mare (bagni sulla spiaggia).
        if x["cat"] == "d":
            e["lat"], e["lng"] = round(x["p"][0], 5), round(x["p"][1], 5)
        entries.append(e)
    entries.sort(key=lambda e: e["km"])
    return entries


primo = parse_gpx(next(iter(GPX.values())))[0]
print("Collaudo dei server Overpass sulla zona del percorso...", flush=True)
ENDPOINTS.extend(collauda_endpoint(primo[0], primo[1]))

for key, path in GPX.items():
    print(f"\n=== {key} ===", flush=True)
    pts = parse_gpx(path)
    # traccia per il viewer: ricampionata sotto i ~1500 punti, quota lisciata
    step = max(1, len(pts)//1500)
    tp = pts[::step]
    cum_t = cumulate(tp)
    ele = [p[2] for p in tp]
    sm = [max(0, round(sum(ele[max(0, i-2):i+3])/len(ele[max(0, i-2):i+3]))) for i in range(len(ele))]
    track = [[round(p[0], 5), round(p[1], 5), sm[i], round(cum_t[i], 2)] for i, p in enumerate(tp)]

    pts2d = [(p[0], p[1]) for p in pts]
    cum = cumulate(pts2d)
    corr = campiona(pts, cum, PASSO)
    print(f"  {cum[-1]:.0f} km, corridoio {len(corr)} punti, {math.ceil(len(corr)/CHUNK)} tratti", flush=True)
    el = scarica(key, corr)
    partner = next((v for pre, v in PARTNER.items() if key.startswith(pre)), None)
    entries = elabora(pts2d, cum, el, partner_route=bool(partner))
    if partner:
        # il POI del partner si aggancia al punto della traccia piu' vicino
        e = dict(partner)
        pp = (partner["lat"], partner["lng"])
        e["km"] = round(min((hav(pp, pts2d[i]), cum[i]) for i in range(len(pts2d)))[1], 1)
        entries.append(e)
        entries.sort(key=lambda x: x["km"])

    tot = {"a": 0, "m": 0, "d": 0}
    for e in entries:
        if e["t"] == "c":
            tot["a"] += e["nf"]; tot["m"] += e["ne"]; tot["d"] += e["ns"]
        else:
            tot[e["t"]] = tot.get(e["t"], 0) + 1
    print(f"  -> {len(entries)} righe | acqua {tot['a']} · mangiare {tot['m']} · dormire {tot['d']}", flush=True)

    out = {"slug": key, "kmTot": round(cum_t[-1], 1), "points": track, "poi": entries}
    open(os.path.join(OUTDIR, f"{key}.json"), "w", encoding="utf-8", newline="\n").write(
        json.dumps(out, ensure_ascii=False, separators=(",", ":")))

    md = [f"# Servizi lungo {key} — da OpenStreetMap\n",
          "Centri con molti servizi raggruppati in una riga. Km indicativi.\n"]
    for e in entries:
        if e["t"] == "c":
            det = [f"{e['ne']} eat" if e['ne'] else "", f"{e['ns']} stays" if e['ns'] else "",
                   f"{e['nf']} fountains" if e['nf'] else ""]
            md.append(f"**km {e['km']:.0f} — {e['name']}** · " + " · ".join(x for x in det if x))
        else:
            ico = {"a": "⛲", "m": "🍝", "d": "🛏️"}[e["t"]]
            n = e.get("name") or e.get("sub", "")
            luogo = f" ({e['luogo']})" if e.get("luogo") else ""
            md.append(f"- {ico} km {e['km']:.0f} — {n}{luogo}")
    open(os.path.join(MD_DIR, f"POI-{key}-OSM.md"), "w", encoding="utf-8").write("\n".join(md))

print("\nfatto: JSON in public/data/itinerari/, liste di revisione in docs/liste-poi/")
