# -*- coding: utf-8 -*-
import os, json
ROOT = "/Users/zale/Desktop/Sito Destinazione (Momento 2)"
D = json.load(open(os.path.join(ROOT,"_dati-partner.json"),encoding="utf-8"))
TER, STR = D["territori"], D["strutture"]
AID="694570b3581ec595fca56708"
def stay22(lat,lng): return f"https://www.stay22.com/allez/roam?aid={AID}&campaign=tuscanytrail&lat={lat}&lng={lng}&product_medium=apps"
TER_IMG={"campiglia-marittima":"images/campiglia.jpg","monterotondo-marittimo":"images/monterotondo.jpg"}
STR_IMG={"punta-ala":"images/punta-ala.jpg","villaggio-orizzonte":"images/villaggio-orizzonte.jpg","villa-toscana":"images/villa-toscana.jpg"}

# ---------------- CSS ----------------
CSS = open(os.path.join(ROOT,"assets","style.css"),encoding="utf-8").read()

def head(title,depth=0,maplibre=False):
    up="../"*depth
    ml_css=f'<link rel="preconnect" href="https://unpkg.com"><link rel="preconnect" href="https://basemaps.cartocdn.com"><link rel="preconnect" href="https://ridewithgps.com"><link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"/>' if maplibre else '<link rel="preconnect" href="https://ridewithgps.com">'
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Caveat:wght@500&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap">
{ml_css}
<link rel="stylesheet" href="{up}assets/style.css">
</head><body>"""

def nav(depth=0):
    up="../"*depth
    return f"""<header class="nav-glass" id="main-nav">
<div class="nav-inner">
<a class="brand" href="{up}index.html"><img src="{up}assets/logo.png" alt="Cycling in Tuscany"></a>
<nav class="nav-pill"><ul>
<li><a href="{up}index.html">Home</a></li>
<li><a href="{up}index.html#stays">Stays</a></li>
<li><a href="{up}index.html#map">Map</a></li>
<li><a href="{up}index.html#territories">Territories</a></li>
<li><a href="{up}index.html#magazine">Magazine</a></li>
</ul></nav>
<div class="nav-right">
<a class="btn-pill-cta" href="{up}index.html#map">Explore →</a>
<button class="nav-burger" id="nav-burger" aria-label="Menu">
<span></span><span></span><span></span>
</button>
</div>
</div>
<div class="nav-mobile-panel" id="nav-mobile-panel">
<ul>
<li><a href="{up}index.html">Home</a></li>
<li><a href="{up}index.html#stays">Stays</a></li>
<li><a href="{up}index.html#map">Map</a></li>
<li><a href="{up}index.html#territories">Territories</a></li>
<li><a href="{up}index.html#magazine">Magazine</a></li>
</ul>
<a class="btn-pill-cta" href="{up}index.html#map" style="margin-top:8px;display:inline-block">Explore the map →</a>
</div>
</header>
<script>
(function(){{
  var nav=document.getElementById('main-nav');
  var burger=document.getElementById('nav-burger');
  var panel=document.getElementById('nav-mobile-panel');
  var threshold=80;
  function upd(){{
    if(window.scrollY>threshold)nav.classList.add('nav-solid');
    else nav.classList.remove('nav-solid');
  }}
  window.addEventListener('scroll',upd,{{passive:true}});
  upd();
  burger.addEventListener('click',function(){{
    var open=nav.classList.toggle('nav-open');
    burger.classList.toggle('is-open',open);
  }});
  panel.querySelectorAll('a').forEach(function(a){{
    a.addEventListener('click',function(){{
      nav.classList.remove('nav-open');
      burger.classList.remove('is-open');
    }});
  }});
}})();
</script>"""

def footer(depth=0):
    up="../"*depth
    return f"""<footer><div class="wrap">
<b style="color:#fff">Cycling in Tuscany</b> — where to ride and where to stay in this Tuscany, from the team behind the Tuscany Trail.<br>
<span class="small">Official territories & bike-friendly stays · tracked booking · routes on Ride with GPS.</span><br><br>
<a href="{up}index.html">Home</a> · <a href="mailto:hello@cyclingintuscany.com">hello@cyclingintuscany.com</a> · Instagram @cyclingintuscany_official
</div></footer></body></html>"""

def loop_card(l):
    badge="gravel" if l["type"].lower()=="gravel" else "road"
    # extract route id and optional privacy_code from url
    url_parts=l['url'].split('?',1)
    route_id=url_parts[0].rstrip('/').split('/')[-1]
    privacy_code=""
    if len(url_parts)>1:
        for param in url_parts[1].split('&'):
            if param.startswith('privacy_code='):
                privacy_code=param.split('=',1)[1]
    img_url="https://ridewithgps.com/routes/"+route_id+"/full.png"
    if privacy_code: img_url+="?privacy_code="+privacy_code
    return f"""<div class="rcard">
<div class="rcard-preview"><img src="{img_url}" alt="{l['name']}" loading="lazy">
<span class="rcard-badge {badge}">{l['type']}</span></div>
<div class="rcard-body">
<h4>{l['name']}</h4>
<div class="rcard-meta"><span><b>{l['km']} km</b></span><span>{l['dislivello']} D+</span><span>{l['diff']}</span></div>
<div class="rcard-reveal"><p class="rcard-hi">{l['hi']}</p><span class="rcard-surface">{l['surface']}</span></div>
<a class="rcard-cta" href="{l['url']}" target="_blank" rel="noopener">Download on Ride with GPS →</a>
</div></div>"""

# ============ SUBPAGES (bodies kept IT for now, chrome EN) ============
def sec_box(tag, title, sub, mb="36px"):
    return f"""<div style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:36px 40px;text-align:center;box-shadow:var(--shadow-sm);margin-bottom:{mb}">
  <div style="display:inline-flex;align-items:center;gap:13px;margin-bottom:14px">
    <div style="height:1px;width:38px;background:#f5a623"></div>
    <span style="font-size:.65rem;font-weight:700;letter-spacing:.17em;text-transform:uppercase;color:#f5a623;font-family:var(--font-body)">{tag}</span>
    <div style="height:1px;width:38px;background:#f5a623"></div>
  </div>
  <h2 style="font-size:2.2rem;margin:0 0 11px;color:var(--fg);font-family:var(--font-display)">{title}</h2>
  <p style="color:var(--muted);font-size:.98rem;max-width:560px;margin:0 auto;line-height:1.55">{sub}</p>
</div>"""
COSA_VEDERE_IMGS={
  "campiglia-marittima":{
    "The medieval borough":"../images/campiglia/DJI_20260520132831_0035_D.jpg",
    "Rocca di Campiglia":"../images/campiglia/roccacampiglia.jpg",
    "Pieve di San Giovanni & Palazzo Pretorio":"../images/campiglia/DJI_20260520132630_0028_D.jpg",
    "Parco Archeominerario di San Silvestro":"../images/campiglia/parco-archeominerario.jpg",
    "Terme del Calidario — Venturina":"../images/campiglia/terme-calidario.jpg",
    "Bike Area Monte Calvi":"../images/campiglia/bike-area-monte-calvi.jpg",
  },
  "monterotondo-marittimo":{
    "Parco delle Biancane":"../images/monterotondo/biancane-parco.jpg",
    "Il borgo & la Rocca degli Alberti":"../images/monteortndo/DJI_20260222102116_0029_D.jpg",
    "Trail Area, Pump Track & Bike Center":"../images/monterotondo/trail-mtb.jpg",
    "Ciclovia delle 3 M":"../images/monterotondo/montieri-borgo.jpg",
  }
}

def build_territory(t):
    premium = t["tier"]=="premium"
    hero_cls="hero premium" if premium else "hero"
    ribbon = f'<div class="ribbon">★ {t["tagline"]}</div>' if premium else f'<div class="ribbon std">Territorio ufficiale</div>'
    ter_imgs=COSA_VEDERE_IMGS.get(t["slug"],{})
    def cv_card(ti,de):
        img=ter_imgs.get(ti)
        if img:
            if isinstance(img,tuple):
                src,pos=img
                img_html=f'<img src="{src}" alt="{ti}" loading="lazy" style="{pos}">'
            else:
                img_html=f'<img src="{img}" alt="{ti}" loading="lazy">'
        else:
            img_html='<div class="cvcard-img-placeholder"><svg width="40" height="40" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#666" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="#666"/><path d="M21 15l-5-5L5 21" stroke="#666" stroke-width="1.5" stroke-linecap="round"/></svg></div>'
        return f"""<div class="cvcard"><div class="cvcard-img">{img_html}</div><div class="cvcard-body"><h3>{ti}</h3><p>{de}</p></div></div>"""
    cosa="".join(cv_card(ti,de) for ti,de in t["cosa_vedere"])
    parts=[head(f'{t["name"]} — Cycling in Tuscany',1), nav(1)]
    img=TER_IMG.get(t["slug"],"")
    hero_style=f' style="background-image:linear-gradient(rgba(20,10,15,.45),rgba(20,10,15,.72)),url(../{img});background-size:cover;background-position:center"' if img else ""
    parts.append(f"""<div class="{hero_cls}"{hero_style}><div class="wrap">{ribbon}
<div class="kick">Territory · {t['area']}</div><h1>{t['name']}</h1><p class="lead">{t['intro']}</p></div></div>""")
    parts.append(f"""<section><div class="wrap"><h2 class="sec">What to see</h2><p class="sub">{t['itinerari_txt']}</p><div class="grid g3">{cosa}</div></div></section>""")
    if t.get("ride_pack"):
        loops="".join(loop_card(l) for l in t["ride_pack"])
        parts.append(f"""<section id="percorsi" style="background:#fff"><div class="wrap"><h2 class="sec">Official routes</h2><p class="sub">Four loops ready to download — open the track in Ride with GPS and ride.</p><div class="grid g2">{loops}</div></div></section>""")
    ch="".join(f'<a class="chip" href="{u}" target="_blank" rel="noopener">{lb} →</a>' for lb,u in t.get("channels",[]))
    nu="".join(f'<li><b>{lb}:</b> {v}</li>' for lb,v in t.get("numeri_utili",[]))
    _dl_svg='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
    _dl_label="Download the complete guide (PDF)" if premium else "Download the Ride Base Pack (PDF)"
    guida_btn = f'<a class="pack-dl-btn" href="{t["guida_pdf"]}" target="_blank"><span class="pack-dl-circle">{_dl_svg}</span>{_dl_label}</a>'
    parts.append(f"""<section style="background:#fff"><div class="wrap"><div class="cta-band"><div><h3>Stay near {t['name']}</h3><p>Book from verified bike-friendly stays in the area — tracked by Cycling in Tuscany.</p></div><a class="btn gold" href="{stay22(t['lat'],t['lng'])}" target="_blank" rel="noopener">Find accommodation →</a></div><div class="grid g2" style="margin-top:22px"><div class="card"><h3>Useful links</h3><div class="chips" style="margin-top:8px">{ch or '<span class="muted small">—</span>'}</div></div><div class="card"><h3>Contacts & materials</h3><ul style="margin:8px 0 14px;padding-left:18px">{nu or '<li class="muted">—</li>'}</ul>{guida_btn}</div></div></div></section>""")
    parts.append(footer(1))
    open(os.path.join(ROOT,"territori",t["slug"]+".html"),"w",encoding="utf-8").write("\n".join(parts))

def build_structure(s):
    chips="".join(f'<span class="chip">{c}</span>' for c in s["services"])
    loops="".join(loop_card(l) for l in s["ride_pack"])
    parts=[head(f'{s["name"]} — Cycling in Tuscany',1), nav(1)]
    img=STR_IMG.get(s["slug"],"")
    hero_style=f' style="background-image:linear-gradient(rgba(20,10,15,.45),rgba(20,10,15,.72)),url(../{img});background-size:cover;background-position:center"' if img else ""
    parts.append(f"""<div class="hero"{hero_style}><div class="wrap"><div class="badge-verif">✔ Official Bike-Friendly Stay · verificata dal Tuscany Trail</div><div class="kick">Struttura · {s['town']}</div><h1>{s['name']}</h1><p class="lead">{s['intro']}</p></div></div>""")
    parts.append(f"""<section><div class="wrap"><h2 class="sec">Servizi bike-friendly</h2><p class="sub">{s['tagline']}</p><div class="chips">{chips}</div></div></section>""")
    n_gravel=sum(1 for l in s["ride_pack"] if l["type"].lower()=="gravel")
    n_road=sum(1 for l in s["ride_pack"] if l["type"].lower()!="gravel")
    dl_icon='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
    parts.append(f"""<section id="percorsi" style="background:#fff"><div class="wrap">
<h2 class="sec">Il Ride Base Pack</h2><p class="sub">Partono dalla porta della struttura. Apri la traccia su Ride with GPS e vai.</p>
<div class="grid g2">{loops}</div>
<div class="pack-dl-bar">
  <div class="pack-dl-bar-glow"></div>
  <div class="pack-dl-bar-left">
    <div class="pack-dl-label">Ride Base Pack · {n_gravel} gravel · {n_road} road</div>
    <h3 class="pack-dl-title">Scarica tutti i percorsi di {s['name']}</h3>
  </div>
  <div class="pack-dl-bar-right">
    <a class="pack-dl-btn" href="../{s['guida_pdf']}" target="_blank">
      <span class="pack-dl-circle">{dl_icon}</span>
      Download PDF
    </a>
  </div>
</div>
</div></section>""")
    parts.append(f"""<section><div class="wrap"><div class="cta-band"><div><h3>Prenota il tuo soggiorno</h3><p>Prenota diretto con la struttura, oppure cerca alternative in zona.</p></div><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn gold" href="{s['site']}" target="_blank" rel="noopener">Prenota su {s['name']} →</a><a class="btn dark" href="{stay22(s['lat'],s['lng'])}" target="_blank" rel="noopener">Altri alloggi in zona</a></div></div></div></section>""")
    parts.append(footer(1))
    open(os.path.join(ROOT,"strutture",s["slug"]+".html"),"w",encoding="utf-8").write("\n".join(parts))

for t in TER: build_territory(t)
for s in STR: build_structure(s)

# ============ HOME (English, photo-forward) ============
GRAD_DARK="linear-gradient(135deg,#2d4a3e,#1a3a2e)"
GRAD_GOLD="linear-gradient(135deg,#2d4a3e,#6b4a10)"
GRAD_EV="linear-gradient(135deg,#c74634,#9c6030)"

# marketing copy per structure (EN), in the order requested
SC = {
 "punta-ala":{"cat":"Bike Resort & Trail Center","img":"images/punta-ala.jpg","cap":"PuntAla — beach bar & sandy beach, sea view",
   "promise":"Everything a rider needs, on site — steps from a Blue-Flag beach.",
   "bul":["Trail Center: guided rides, rentals, workshop support","Ride, eat, recover, repeat — with zero hassle","Maremma coast and pine-forest landscapes"]},
 "villaggio-orizzonte":{"cat":"Family & Groups","img":"images/villaggio-orizzonte.jpg","cap":"Villaggio Orizzonte — cyclist in a sunlit green field",
   "promise":"A seaside holiday village built for easy logistics — families, groups and team stays.",
   "bul":["Plenty of on-site services for group comfort","Coastal riding plus inland day trips","Everything close, one relaxed base"]},
 "villa-toscana":{"cat":"Relax & Ride","img":"images/villa-toscana.jpg","cap":"Villa Toscana — aerial view, villa with pool in the countryside",
   "promise":"Quiet countryside and a pool — the comfortable base for recovery days and easy ride planning.",
   "bul":["Bike-friendly stay with local route knowledge","Coastal rides mixed with inland hills and white roads","E-bike / MTB options and guided rides available"]},
}
STR_ORDER=["punta-ala","villaggio-orizzonte","villa-toscana"]
str_by_slug={s["slug"]:s for s in STR}

DCARD_TC={
  "punta-ala":"34 55% 18%",
  "villaggio-orizzonte":"196 42% 18%",
  "villa-toscana":"26 45% 20%",
}
DCARD_ARROW='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'

def dcard(slug):
    s=str_by_slug[slug]; c=SC[slug]; tc=DCARD_TC[slug]
    n=len(s.get("ride_pack") or [])
    return f"""<div class="dcard-outer" style="--tc:{tc}">
<div class="dcard">
<div class="dcard-bg" style="background-image:url('{c['img']}')"></div>
<div class="dcard-grad"></div>
<a class="dcard-cover" href="strutture/{slug}.html" aria-label="See {s['name']}"></a>
<div class="dcard-body">
<h3>{s['name']}</h3>
<p>{c['cat']} · {s['town']} · {n} routes</p>
<a class="dcard-btn" href="strutture/{slug}.html"><span>See the stay</span>{DCARD_ARROW}</a>
<a class="dcard-btn-sec" href="strutture/{slug}.html#percorsi">See the routes {DCARD_ARROW}</a>
</div>
</div></div>"""

# territory data
camp=[t for t in TER if t["tier"]=="premium"][0]
mont=[t for t in TER if t["tier"]!="premium"][0]

def tcard(t,img,cap,tag,town):
    return f"""<a class="tcard" href="territori/{t['slug']}.html">
<div class="photo" style="background-image:url('{img}'), {GRAD_DARK}"><span class="cap">📷 {cap}</span></div>
<div class="tbody"><div class="tag">{tag}</div><h3>{t['name']}</h3><p class="town">{town}</p><span class="go">Discover →</span></div></a>"""

_ter_arrow='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'

# markers — premium LAST so it renders on top in the DOM
markers=[]
for t in TER:
    if t["tier"]!="premium":
        rp="percorsi" if t.get("ride_pack") else ""
        markers.append({"name":t["name"],"kind":"territory","lat":t["lat"],"lng":t["lng"],"page":"territori/"+t["slug"]+".html","book":stay22(t["lat"],t["lng"]),"sub":t["area"],"img":TER_IMG.get(t["slug"],""),"rp":rp})
for s in STR:
    img=SC[s["slug"]]["img"] if s["slug"] in SC else ""
    markers.append({"name":s["name"],"kind":"structure","lat":s["lat"],"lng":s["lng"],"page":"strutture/"+s["slug"]+".html","book":s["site"],"sub":s["town"],"img":img,"rp":"percorsi"})
for t in TER:
    if t["tier"]=="premium":
        rp="percorsi" if t.get("ride_pack") else ""
        markers.append({"name":t["name"],"kind":"premium","lat":t["lat"],"lng":t["lng"],"page":"territori/"+t["slug"]+".html","book":stay22(t["lat"],t["lng"]),"sub":t["area"],"img":TER_IMG.get(t["slug"],""),"rp":rp})
mjson=json.dumps(markers,ensure_ascii=False)

home=[head("Cycling in Tuscany — plan your Tuscany cycling holiday",0,maplibre=True), nav(0)]
# HERO glass
home.append(f"""<section class="hero-glass">
<div class="hero-bg" style="background-image:url('images/hero.jpg')"></div>
<div class="hero-glow-gold"></div>
<div class="hero-glow-green"></div>
<div class="wrap hero-grid">
  <div class="hero-left">
    <div class="hero-sys-tag"><span class="sys-dot"></span>Cycling Destination · Costa degli Etruschi</div>
    <h1 class="hero-title">Plan your<br><em class="hero-em">Tuscany</em><br>cycling holiday.</h1>
    <p class="hero-lead">Handpicked territories, verified bike-friendly stays and routes ready to download. Curated by the team behind the Tuscany Trail.</p>
    <div class="hero-actions">
      <a class="btn gold neon-glow" href="#map">Explore the map →</a>
      <a class="btn ghost-white" href="#stays">See verified stays</a>
    </div>
  </div>
</div>
</section>""")
# CAMPIGLIA feature — rounded top slides over the hero
home.append(f"""<section class="feature" style="background-image:linear-gradient(rgba(10,5,8,.45),rgba(10,5,8,.88)), url('images/campiglia.jpg'), {GRAD_GOLD};border-radius:28px 28px 0 0;margin-top:-40px;position:relative;z-index:5;box-shadow:0 -12px 48px rgba(0,0,0,.55)">
<div class="wrap"><div class="ribbon">Home of the Tuscany Trail</div>
<div class="kick">Costa degli Etruschi ★</div><h2>Campiglia Marittima</h2>
<p>We didn't choose it by chance as the start and finish of the Tuscany Trail. From here you get direct access to one of the finest cycling areas in all of Tuscany — and a medieval town that's a joy even off the bike.</p>
<a class="btn gold" href="territori/{camp['slug']}.html">Discover Campiglia →</a></div>
</section>""")
# STAYS — destination cards
home.append(f"""<section id="stays" style="background:var(--cream)"><div class="wrap" style="max-width:1320px">
{sec_box("Verified Stays","Official Bike-Friendly Stays","Verified bases: bike storage, wash, early breakfast and their own route pack.<br>Pick the one that fits your trip.")}
<div class="stays-grid">
{dcard('punta-ala')}
{dcard('villaggio-orizzonte')}
{dcard('villa-toscana')}
</div></div></section>""")
# MAP
home.append(f"""<section id="map" style="padding:80px 0 0;background:var(--cream)">
<div class="wrap" style="position:relative;z-index:10">
{sec_box("Explore the destination","The destination map","Official territories and stays, all in one place. Click a pin for routes, details and booking.",mb="40px")}
</div>
<div id="map-el"></div>
</section>""")
# SOCIAL PROOF
# TERRITORIES — horizontal carousel
_ter_mont_slide=f"""<a class="ter-slide" href="territori/{mont['slug']}.html">
<div class="ter-slide-inner">
<div class="ter-slide-img" style="background-image:url('images/monterotondo.jpg')"></div>
<div class="ter-slide-grad"></div>
<div class="ter-slide-body">
<span class="ter-slide-tag">Official Territory</span>
<div class="ter-slide-title">{mont['name']}</div>
<div class="ter-slide-desc">Metalliferous Hills — geothermal landscape, white hills, routes that breathe.</div>
<div class="ter-slide-cta">Discover {_ter_arrow}</div>
</div></div></a>"""
_ter_soon1="""<div class="ter-slide ter-slide-soon">
<div class="ter-slide-inner">
<div class="ter-soon-glow"></div>
<div class="ter-soon-lines"></div>
<div class="ter-soon-icon">
<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="48" cy="48" r="44" stroke="rgba(245,166,35,.22)" stroke-width="1.5" stroke-dasharray="3 7"/>
  <circle cx="48" cy="48" r="30" stroke="rgba(255,255,255,.07)" stroke-width="1"/>
  <path d="M48 6 L53 43 L48 39 L43 43 Z" fill="#f5a623"/>
  <path d="M48 90 L43 53 L48 57 L53 53 Z" fill="rgba(255,255,255,.22)"/>
  <path d="M90 48 L53 43 L57 48 L53 53 Z" fill="rgba(255,255,255,.18)"/>
  <path d="M6 48 L43 53 L39 48 L43 43 Z" fill="rgba(255,255,255,.18)"/>
  <circle cx="48" cy="48" r="6" fill="#f5a623" opacity=".9"/>
  <circle cx="48" cy="48" r="2.5" fill="#0e1a12"/>
  <text x="48" y="24" text-anchor="middle" dominant-baseline="middle" fill="rgba(245,166,35,.55)" font-size="8" font-family="monospace" font-weight="700" letter-spacing="2">N</text>
</svg>
</div>
<div class="ter-slide-body">
<span class="soon-badge"><span class="soon-badge-dot"></span>Coming 2026</span>
<div class="ter-slide-title">New Territory</div>
<div class="ter-slide-desc">A new corner of Tuscany is joining the map — routes, stays and stories, curated as always.</div>
</div></div></div>"""
_ter_soon2="""<div class="ter-slide ter-slide-soon">
<div class="ter-slide-inner">
<div class="ter-soon-glow"></div>
<div class="ter-soon-lines"></div>
<div class="ter-soon-icon">
<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="48" cy="48" r="44" stroke="rgba(245,166,35,.22)" stroke-width="1.5" stroke-dasharray="3 7"/>
  <path d="M16 72 Q22 54 38 48 Q54 42 62 30 Q68 18 80 14" stroke="rgba(255,255,255,.38)" stroke-width="2" fill="none" stroke-linecap="round" stroke-dasharray="5 5"/>
  <circle cx="16" cy="72" r="5" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"/>
  <circle cx="48" cy="39" r="4.5" fill="#f5a623" opacity=".85"/>
  <circle cx="80" cy="14" r="10" fill="rgba(245,166,35,.18)" stroke="rgba(245,166,35,.4)" stroke-width="1.5"/>
  <circle cx="80" cy="14" r="4" fill="#f5a623" opacity=".9"/>
  <path d="M76 14 L80 10 L84 14" stroke="#f5a623" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>
</svg>
</div>
<div class="ter-slide-body">
<span class="soon-badge"><span class="soon-badge-dot"></span>More to come</span>
<div class="ter-slide-title">Keep riding</div>
<div class="ter-slide-desc">Cycling in Tuscany keeps growing. More territories, more routes, more reasons to come back.</div>
</div></div></div>"""
home.append(f"""<section id="territories" style="background:var(--cream);padding:80px 0">
<div class="wrap">
  <div class="ter-carousel-hd">
    <div>
      <div style="display:inline-flex;align-items:center;gap:13px;margin-bottom:14px">
        <div style="height:1px;width:38px;background:#f5a623"></div>
        <span style="font-size:.65rem;font-weight:700;letter-spacing:.17em;text-transform:uppercase;color:#f5a623;font-family:var(--font-body)">Official Territories</span>
        <div style="height:1px;width:38px;background:#f5a623"></div>
      </div>
      <h2 style="font-size:2.8rem;margin:0 0 10px;color:var(--fg);font-family:var(--font-display);line-height:1.05">Territories to explore</h2>
      <p style="color:var(--muted);max-width:500px;font-size:.98rem;margin:0;line-height:1.55">The many souls of this corner of Tuscany, one ride at a time.<br>Campiglia leads — more territories are joining the map.</p>
    </div>
    <div class="ter-nav-btns">
      <button class="ter-nav-btn" id="ter-prev" aria-label="Previous"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg></button>
      <button class="ter-nav-btn" id="ter-next" aria-label="Next"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
    </div>
  </div>
</div>
<div class="ter-carousel-scroll" id="ter-carousel-scroll">
{_ter_mont_slide}
{_ter_soon1}
{_ter_soon2}
</div>
<div class="ter-dots">
<button class="ter-dot active" aria-label="Slide 1"></button>
<button class="ter-dot" aria-label="Slide 2"></button>
<button class="ter-dot" aria-label="Slide 3"></button>
</div>
<script>
(function(){{
  var sc=document.getElementById('ter-carousel-scroll');
  var slides=sc.querySelectorAll('.ter-slide');
  var dots=document.querySelectorAll('.ter-dot');
  var prev=document.getElementById('ter-prev');
  var next=document.getElementById('ter-next');
  function active(){{
    var best=0,bestD=Infinity,cr=sc.getBoundingClientRect();
    slides.forEach(function(s,i){{var d=Math.abs(s.getBoundingClientRect().left-cr.left);if(d<bestD){{bestD=d;best=i;}}}});
    return best;
  }}
  function upd(){{
    var a=active();
    dots.forEach(function(d,i){{d.classList.toggle('active',i===a);}});
    prev.disabled=(sc.scrollLeft<=2);
    next.disabled=(sc.scrollLeft>=sc.scrollWidth-sc.clientWidth-2);
  }}
  function goTo(i){{sc.scrollBy({{left:slides[i].getBoundingClientRect().left-sc.getBoundingClientRect().left,behavior:'smooth'}});}}
  prev.addEventListener('click',function(){{goTo(Math.max(0,active()-1));}});
  next.addEventListener('click',function(){{goTo(Math.min(slides.length-1,active()+1));}});
  dots.forEach(function(d,i){{d.addEventListener('click',function(){{goTo(i);}});}});
  sc.addEventListener('scroll',upd,{{passive:true}});
  upd();
}})();
</script>
</section>""")
# MAGAZINE
home.append(f"""<section id="magazine"><div class="wrap">
{sec_box("From the field","Cycling in Tuscany Magazine","Real stories from each territory — routes, places, people. Read here, no PDF.")}
<div class="cta-band" style="margin-top:0"><div><p style="color:var(--muted);margin:0">First issue: Monterotondo Marittimo — the geothermal hills, where the earth breathes.</p></div><a class="btn gold" href="territori/{mont['slug']}.html">Read now →</a></div>
</div></section>""")
# FAQ
home.append("""<section id="faq" style="background:#fff"><div class="wrap" style="max-width:780px">
""" + sec_box("Plan your trip","Frequently asked questions","Quick answers before you go.") + """
<div style="margin-top:8px">
<details class="acc"><summary>What is Cycling in Tuscany?</summary></details>
<details class="acc"><summary>When is the best time to come?</summary></details>
<details class="acc"><summary>Are routes suitable for beginners or e-bikes?</summary></details>
<details class="acc"><summary>Do I need a guide?</summary></details>
<details class="acc"><summary>What's in a route pack?</summary></details>
<details class="acc"><summary>How do I book a stay?</summary></details>
<details class="acc"><summary>What is the Tuscany Trail?</summary></details>
<details class="acc"><summary>What's the difference between a territory and a stay?</summary></details>
</div>
</div></section>""")
# maplibre
home.append(f"""<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<script>
var M={mjson};
var col={{premium:'#f5a623',territory:'#2d4a3e',structure:'#c74634'}};
var map=new maplibregl.Map({{container:'map-el',style:'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',center:[10.68,42.98],zoom:9,scrollZoom:false,attributionControl:{{compact:true}}}});
map.on('load',function(){{
  var bounds=new maplibregl.LngLatBounds();
  M.forEach(function(m){{
    var el=document.createElement('div');
    el.style.cursor='pointer';
    var isPremium=m.kind==='premium';
    var svgW=isPremium?38:26;var svgH=isPremium?50:34;
    var svgPin='<svg xmlns="http://www.w3.org/2000/svg" width="'+svgW+'" height="'+svgH+'" viewBox="0 0 24 32" style="display:block;filter:drop-shadow(0 '+(isPremium?'4px 14px':'2px 8px')+' rgba(0,0,0,'+(isPremium?'.7':'.55')+'))"><path d="M12 0C5.37 0 0 5.37 0 12c0 7.5 12 20 12 20s12-12.5 12-20C24 5.37 18.63 0 12 0z" fill="'+col[m.kind]+'" stroke="'+(isPremium?'#fff':'rgba(255,255,255,.85)')+'" stroke-width="'+(isPremium?'2':'1')+'"/><circle cx="12" cy="11" r="'+(isPremium?'5.5':'4.5')+'" fill="rgba(255,255,255,'+(isPremium?'.95':'.9')+')"/></svg>';
    if(isPremium){{
      el.innerHTML='<div style="position:relative;width:'+svgW+'px;height:'+svgH+'px"><div style="position:absolute;top:17px;left:19px;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#f5a623;animation:pinpulse 2.4s ease-out infinite"></div>'+svgPin+'</div>';
    }}else{{
      el.innerHTML=svgPin;
    }}
    var label=m.kind==='structure'?'Official Bike-Friendly Stay':(m.kind==='premium'?'Home of the Tuscany Trail':'Official territory');
    var ctaLabel=m.kind==='structure'?'See the stay →':'Discover →';
    var routeLabel=m.kind==='structure'?'See the route pack →':'See the routes →';
    var popup=new maplibregl.Popup({{offset:isPremium?30:25,closeButton:false,closeOnClick:true,maxWidth:'none',anchor:'bottom'}})
      .setHTML('<div style="width:218px">'+(m.img?'<div style="height:134px;background:url('+m.img+') center/cover no-repeat;border-radius:8px;margin-bottom:11px"></div>':'')+'<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:'+col[m.kind]+'">'+label+'</div><b style="font-size:1rem;display:block;margin:4px 0 2px">'+m.name+'</b><span style="color:#6b6b6b;font-size:.82rem">'+m.sub+'</span><div style="margin-top:11px;display:flex;flex-direction:column;gap:6px"><a href="'+m.page+'" style="display:block;background:#c74634;color:#fff;font-weight:700;font-size:.82rem;padding:10px 14px;border-radius:9px;text-decoration:none;text-align:center">'+ctaLabel+'</a>'+(m.rp?'<a href="'+m.page+'#'+m.rp+'" style="display:block;background:#faf3e0;color:#b8860b;font-weight:700;font-size:.82rem;padding:10px 14px;border-radius:9px;text-decoration:none;text-align:center">'+routeLabel+'</a>':'')+'</div></div>');
    new maplibregl.Marker({{element:el,anchor:'bottom'}}).setLngLat([m.lng,m.lat]).setPopup(popup).addTo(map);
    bounds.extend([m.lng,m.lat]);
  }});
  map.fitBounds(bounds,{{padding:{{top:80,bottom:60,left:80,right:80}},maxZoom:9}});
}});
</script>""")
home.append(footer(0))
open(os.path.join(ROOT,"index.html"),"w",encoding="utf-8").write("\n".join(home))
print("home EN foto-forward generata + subpages rigenerate")
