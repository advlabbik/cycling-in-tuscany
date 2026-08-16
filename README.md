# Cycling in Tuscany

Guida di destinazione per il cicloturismo in Toscana: territori selezionati, strutture bike-friendly e ride pack pronti da scaricare. Sito **statico**, generato con [Astro](https://astro.build), editabile a form con [Sveltia CMS](https://github.com/sveltia/sveltia-cms), pubblicato su Cloudflare Pages.

| | |
|---|---|
| Produzione | <https://cyclingintuscany.tuscanytrail.it> |
| CMS | <https://cyclingintuscany.tuscanytrail.it/admin/> |
| Spec tecnica | [`docs/superpowers/specs/2026-07-24-refactor-astro-cms-design.md`](docs/superpowers/specs/2026-07-24-refactor-astro-cms-design.md) |

## Come si modifica il sito

Due strade, stesso risultato: **un commit su `main`**. Cloudflare Pages builda da lì e pubblica.

**Dal CMS** — <https://cyclingintuscany.tuscanytrail.it/admin/>, login con GitHub. **Va usato questo dominio, non `cycling-in-tuscany-astro.pages.dev/admin/`**: il `pages.dev` serve lo stesso build e l'interfaccia si apre, ma il worker di auth non lo ha negli `ALLOWED_DOMAINS`, quindi il login GitHub muore con `UNSUPPORTED_DOMAIN` (vedi [Autenticazione del CMS](#autenticazione-del-cms)). Salvare **è** pubblicare: Sveltia non ha editorial workflow, non esistono bozze. Il salvataggio scrive un commit, il commit fa partire il build, il build va live in un paio di minuti.

**Da editor** — si toccano i `.md` in `src/content/`, si committa, si pusha. Stesso identico effetto.

I due percorsi scrivono gli stessi file, quindi non c'è una fonte "vera" e una secondaria. Ma la configurazione del CMS (`public/admin/config.yml`) e lo schema Zod (`src/content.config.ts`) devono restare allineati: **un campo obbligatorio nello schema ma assente nel config fa fallire il build al primo salvataggio dal form.** Se il build rompe subito dopo un salvataggio, il messaggio di Astro dice quale campo.

## Struttura

```text
src/
├─ content/            # LA fonte dati — territori, strutture, itinerari, faq (Content Collections)
├─ content.config.ts   # schema Zod delle collezioni
├─ assets/images/      # immagini ottimizzate da astro:assets
├─ components/         # Map.astro, RouteViewer.astro (mappa+altimetria+POI), card, sezioni
├─ layouts/Base.astro  # head, SEO, nav, footer
└─ pages/              # index + rotte dinamiche /territori/, /strutture/ e /itinerari/[slug]
public/
├─ admin/              # Sveltia CMS: index.html + config.yml
├─ guide-pdf/          # PDF serviti così come sono, fuori da astro:assets
├─ data/itinerari/     # traccia+POI per itinerario, GENERATI da scripts/gen_poi.py — mai a mano
└─ gpx/                # GPX scaricabili (dietro il gate email)
functions/api/lead.js  # Pages Function del gate email → Brevo (chiavi nelle env Cloudflare)
scripts/gen_poi.py     # genera public/data/itinerari/<slug>.json da GPX + OpenStreetMap
site.config.ts         # aid Stay22, brand, centro mappa, ordine strutture in home
docs/fonti/            # brief, sorgenti magazine, dati partner del vecchio prototipo
docs/liste-poi/        # liste POI leggibili per la revisione umana, una per itinerario
```

**Le immagini vanno in `src/assets/images/`, non in `public/`.** I `.md` le referenziano con path relativo (`../../assets/images/x.jpg`): è l'unica forma che `image()` di `astro:assets` risolve, e il CMS è configurato per scrivere esattamente quella. Un path assoluto tipo `/images/x.jpg` fa fallire il build con `ImageNotFound`. I PDF invece stanno in `public/guide-pdf/` proprio perché **non** devono passare dalla pipeline di ottimizzazione.

## Gli itinerari (mini-guide)

Ogni itinerario in `src/content/itinerari/` è una pagina con il RouteViewer
(mappa MapLibre + altimetria + POI filtrabili), la sezione Good to know coi
contenuti che prima stavano nel PDF, e il gate email che sblocca il solo GPX.
Regole decise da Andrea il 14/8/2026:

- **Il Ride Base Pack non si scarica**: i contenuti vivono nelle pagine
  (Good to know per itinerario, `extraSections` nella scheda struttura).
  L'unico download è il GPX, dietro email.
- **Esclusiva partner**: sugli itinerari con `base` (la struttura pagante)
  non compaiono Stay22, Airbnb né alloggi concorrenti nei POI — si dorme solo
  dal partner. Il blocco Stay22+Airbnb esiste nel template solo per itinerari
  senza `base` (es. la futura pagina del Tuscany Trail).
- **POI solo da `scripts/gen_poi.py`** (OSM/Overpass, porting dello script di
  tg-guida con le sue trappole documentate): mai stimare coordinate a mano.
  Le liste in `docs/liste-poi/` vanno riviste da un umano prima di pubblicare.
- **Km e dislivelli ufficiali** vengono dal materiale del partner (PDF/frontmatter),
  mai ricalcolati dal GPX.

## Da implementare al momento giusto (decisioni già prese)

**App partecipanti Tuscany Trail + "Arriva preparato" (Andrea, 15/8/2026).**
L'app partecipanti del TT nascerà derivandola da `advlabbik/tg-guida` (repo da
creare; il TT è l'unico evento che sviluppa anche la parte turistica, cioè
questo sito). Nella checklist pre-evento dell'app va aggiunto il punto
**"Arriva preparato"**: la lista delle cose che il partecipante potrebbe dover
comprare, ogni voce linkata allo shop online dello sponsor con lo sconto
dedicato ai partecipanti — gomme Vittoria, borse Miss Grape, sella Selle
Italia, scarpe Northwave, casco e antifurto Abus, nutrizione Enervit,
abbigliamento RH+ — e **Sportler** (sponsor) per tutto il resto. Si sperimenta
solo sul Tuscany Trail; se funziona si estende a tutti gli eventi. Prima dello
sviluppo servono codici sconto, link shop e testi IT/EN. Nota gemella nel
README di tg-guida.

**Email post-acquisto Tuscany Trail — "due piccioni con una fava" (Andrea, 14/8/2026).**
Nell'email di avvenuto acquisto TT il link prenotazioni porta alla mappa
**Stay22 centrata sulla fiera di Venturina** (il quartier generale dell'evento),
così tutti prenotano subito; **sotto la mappa, le strutture consigliate** per
chi vuole allungare la vacanza prima o dopo — anch'esse linkate **via Stay22**,
così nessun partner può obiettare sulla parità di trattamento. Niente schede o
pagine intermedie dove la gente si perde: un link, una mappa, si prenota.
Campagna Stay22 dedicata per misurare tutto.

## Lavoro in sospeso: rigenerazione POI (15/8, sera)

I negozi di bici (categoria `b`) e il raggruppamento delle fontane sono attivi
nel generatore e nel viewer, ma **solo 3 percorsi su 16 hanno i dati nuovi**
(vt-gravel-1, vt-gravel-2, vt-road-1): la rigenerazione completa richiede di
riscaricare tutto da Overpass (le cache vecchie non contengono i bike shop) ed
è stata interrotta per scelta — Overpass rispondeva a singhiozzo. Gli altri 13
JSON restano validi, semplicemente senza negozi e con le fontane non
raggruppate. Per completare, in un momento in cui Overpass respira:

```bash
python scripts/gen_poi.py vt-road-2="<gpx>" pacr-gravel-1="public/gpx/PACR-Gravel-1.gpx" ... mr-road-2="public/gpx/MR-Road-2.gpx"
```

(i tre gia' fatti hanno la cache in `scripts/_osm_*.json` e si saltano da soli;
la lista completa degli argomenti e' nel commit "Marker stabili su mobile...").

## Regole di gestione del progetto (imparate su tg-guida)

Prese dal README/CLAUDE.md di `advlabbik/tg-guida`, valgono anche qui:

- **Sempre branch dedicato + merge**, mai commit diretti su `main` (che qui è
  produzione via Cloudflare Pages). Ogni branch ha il suo preview automatico.
- **Tag di ritorno prima di ogni pubblicazione grossa** (`v-...`): il rollback
  è un force-push della tag vecchia su main, un comando solo.
- **Verificare in locale prima di pushare**: main non è l'ambiente di anteprima.
- **README e issue GitHub aggiornati come parte del lavoro**, nello stesso
  commit o in quello dopo — non su richiesta. Un README che descrive uno stato
  superato fa perdere tempo a chi arriva dopo.
- **Tracciare i problemi come issue GitHub**, chiuderle o commentarle quando
  il lavoro le supera.
- **Airbnb: SOLO dentro la mappa Stay22** (regola di Andrea, 15/8, valida per
  tutti i progetti con Stay22 — anche Trentino Gravel). Finché non troviamo il
  parametro che mostra Airbnb dentro l'embed, NIENTE pulsanti o link che
  portano su Airbnb. Il metodo andrebbe cercato con Francesco o col supporto
  Stay22 (nel repo stay22-gpx non c'è, verificato 15/8).

## I tier dei territori

`tier` non è decorativo, è la gerarchia commerciale: chi paga di più sta più in alto.

- **`premium`** — trattamento di punta: hero dorato, ribbon *Home of the Tuscany Trail*, box in evidenza in home, download della guida completa. Oggi solo Campiglia Marittima.
- **`standard`** — territorio ufficiale normale (Monterotondo Marittimo).

Le strutture sono sempre *Official Bike-Friendly Stay*, tutte sullo stesso livello fra loro.

## Sviluppo in locale

Serve **Node 22.12.0**, la versione in `.nvmrc`:

```sh
nvm use
npm ci
npm run dev      # http://localhost:4321
```

Non è un dettaglio opzionale. Cloudflare Pages legge `.nvmrc` e builda con Node 22.12 → npm 10.9.2, e il `package-lock.json` è risolto per quella versione. Con Node 25 (npm 11) `npm ci` fallisce, perché npm 11 pretende un albero di dipendenze diverso:

```
npm error `npm ci` can only install packages when your package.json
npm error and package-lock.json are in sync.
```

Per lo stesso motivo, **il lockfile non va rigenerato da zero** per far passare un errore di `npm ci`: `npm install` scrive solo i binari nativi della piattaforma su cui gira, e potando le altre si rompe il build sul runner Linux (`Cannot find module '@rolldown/binding-linux-x64-gnu'`). Le entry mancanti si aggiungono; l'albero non si ricostruisce.

| Comando | Cosa fa |
| :--- | :--- |
| `npm run dev` | dev server su `localhost:4321` |
| `npm run build` | build di produzione in `./dist/` |
| `npm run preview` | anteprima locale del build |

## Deploy

Cloudflare Pages, progetto `cycling-in-tuscany-astro`, collegato alla repo. `main` → produzione, ogni altro branch → preview automatico.

Build command `npm run build`, output `dist`. **Vale la pena ricontrollarli ogni tanto:** il flusso "autoconfig" di Cloudflare Workers li ha già azzerati una volta, e con quei campi vuoti Pages pubblica la root della repo al posto del sito.

## Autenticazione del CMS

Il login GitHub passa dal worker `bikepacking-cms-auth`, **condiviso con bikepacking.it** — non è duplicato per questo progetto, e il client secret vive lì dentro, mai nella repo.

Due cose da sapere quando il login smette di funzionare:

1. Il dominio da cui si apre `/admin/` deve stare negli `ALLOWED_DOMAINS` del worker, altrimenti risponde `UNSUPPORTED_DOMAIN`. Per questo progetto l'unico dominio in lista è `cyclingintuscany.tuscanytrail.it`: da `cycling-in-tuscany-astro.pages.dev` e da `cyclingintuscany.com` il CMS si apre ma il login non parte. È un Secret: si aggiunge un dominio riscrivendo **tutta** la lista, quindi va ricopiata per intero o si cancellano i domini di bikepacking.it.
2. La org GitHub `advlabbik` ha attive le *OAuth App access restrictions*: la app di auth va approvata a livello di org.

## Decisioni ecosistema — 16 agosto 2026

Analisi completa dei 4 progetti digitali e registro decisioni con le motivazioni nella pagina Notion [Ecosistema App BAS — analisi e registro decisioni](https://app.notion.com/p/3bef88ad0121819487aceb41d1a89781). Qui solo ciò che tocca questo repo.

- **PRIORITÀ 1 — verificare `BREVO_API_KEY` e `BREVO_LIST_ID` nelle env di Cloudflare Pages** — senza chiave `/api/lead` risponde `{ok, demo}` in silenzio e i lead del gate vanno persi (il gate è live dal 15/8 sera). Gli attributi `CIT_*` vanno creati in Brevo PRIMA di mettere la chiave.
- **Privacy policy da riscrivere** — dichiara "this site has no forms" mentre il gate email è live; da sistemare anche il paragrafo Airbnb rimasto nella affiliate disclosure.
- **UTM anche nei bottoni partner dentro il RouteViewer** — oggi i "Book …" di popup e card usano l'URL grezzo del JSON — traffico non attribuito, e il report di attribuzione è l'argomento di rinnovo dei partner.
- **Stay22 — si resta, si negozia lo split** — Booking ha chiuso gli affiliati diretti sotto €1k/mese (giu 2025), 37 delle nostre 38 prenotazioni sono Booking, e nessun altro ha l'embed lungo-GPX multi-OTA. Call post-evento TG col dossier dati per salire dal tier d'ingresso (30%) + domanda Airbnb-dentro-l'embed. `src/lib/stay22.ts` è il candidato a modulo condiviso per le app evento.
