# Cycling in Tuscany

Guida di destinazione per il cicloturismo in Toscana: territori selezionati, strutture bike-friendly e ride pack pronti da scaricare. Sito **statico**, generato con [Astro](https://astro.build), editabile a form con [Sveltia CMS](https://github.com/sveltia/sveltia-cms), pubblicato su Cloudflare Pages.

| | |
|---|---|
| Produzione | <https://365.tuscanytrail.it> |
| CMS | <https://365.tuscanytrail.it/admin/> |
| Spec tecnica | [`docs/superpowers/specs/2026-07-24-refactor-astro-cms-design.md`](docs/superpowers/specs/2026-07-24-refactor-astro-cms-design.md) |

## Come si modifica il sito

Due strade, stesso risultato: **un commit su `main`**. Cloudflare Pages builda da lì e pubblica.

**Dal CMS** — <https://365.tuscanytrail.it/admin/>, login con GitHub. **Va usato questo dominio, non `cycling-in-tuscany-astro.pages.dev/admin/`**: il `pages.dev` serve lo stesso build e l'interfaccia si apre, ma il worker di auth non lo ha negli `ALLOWED_DOMAINS`, quindi il login GitHub muore con `UNSUPPORTED_DOMAIN` (vedi [Autenticazione del CMS](#autenticazione-del-cms)). Salvare **è** pubblicare: Sveltia non ha editorial workflow, non esistono bozze. Il salvataggio scrive un commit, il commit fa partire il build, il build va live in un paio di minuti.

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
└─ gpx/                # i file GPX (il gate li SPEDISCE via email, in pagina non si scaricano)
functions/api/lead.js  # gate email: contatto Brevo + email col GPX allegato (chiavi nelle env Cloudflare)
scripts/gen_poi.py     # genera public/data/itinerari/<slug>.json da GPX + OpenStreetMap
site.config.ts         # aid Stay22, brand, centro mappa, ordine strutture in home
docs/fonti/            # brief, sorgenti magazine, dati partner del vecchio prototipo
docs/liste-poi/        # liste POI leggibili per la revisione umana, una per itinerario
```

**Le immagini vanno in `src/assets/images/`, non in `public/`.** I `.md` le referenziano con path relativo (`../../assets/images/x.jpg`): è l'unica forma che `image()` di `astro:assets` risolve, e il CMS è configurato per scrivere esattamente quella. Un path assoluto tipo `/images/x.jpg` fa fallire il build con `ImageNotFound`. I PDF invece stanno in `public/guide-pdf/` proprio perché **non** devono passare dalla pipeline di ottimizzazione.

## Gli itinerari (mini-guide)

Ogni itinerario in `src/content/itinerari/` è una pagina con il RouteViewer
(mappa MapLibre + altimetria + POI filtrabili), la sezione Good to know coi
contenuti che prima stavano nel PDF, e il gate email che spedisce il GPX.
Regole decise da Andrea il 14/8/2026:

- **Il Ride Base Pack non si scarica**: i contenuti vivono nelle pagine
  (Good to know per itinerario, `extraSections` nella scheda struttura).
  L'unico file che si ottiene è il GPX, e dal 27/8/2026 **arriva via email**
  — in pagina non c'è nessun download.
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

## Date della mappa prenotazioni (18 agosto 2026)

La mappa Stay22 non si apre mai con le caselle date vuote: senza date non mostra
né prezzi né disponibilità, e chi arriva dalla mail se ne va.

- **Ripiego**: `defaultStayDates` in `site.config.ts` — la notte prima della prima
  partenza TT. Chi arriva per altre date se la cambia (scelta di Andrea: meglio una
  data cambiabile che due caselle vuote). ⚠️ Le date lì dentro sono **ipotizzate**
  sul 2026, vanno confermate sul calendario TT27 ufficiale.
- **Data personale dalla mail**: basta che il link porti
  `?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD` e la mappa si apre su quella notte.
  Funziona su home e pagine territorio, in automatico.
  Il dato per costruirlo esiste già: il meta d'ordine **`datapartenza`** è presente
  sul 100% delle righe TT (6.494 su 6.494 nel 2026), in forma `20/05mattina` /
  `20/05pomeriggio` — tre giorni di partenza, mattina e pomeriggio. Chi scrive la
  mail deve solo mappare i tre giorni sulle rispettive notti precedenti, e tollerare
  due valori sporchi (`20/05mattino`, `21/0mattina` — 2 righe su 6.494).
- Le date si prendono **in coppia da una fonte sola**: se il link ne porta una
  sbagliata, invertita o singola, si torna al ripiego invece di mescolare le due
  fonti (arrivo dal ripiego + partenza dal link darebbe tre notti invece di una,
  senza che nessuno se ne accorga).

## Trappole delle mappe (condivise con tutti i progetti BAS che hanno mappe)

**Il posizionamento di un marker non è roba nostra: lo fa la libreria, con una sua
classe** — `.maplibregl-marker{position:absolute}` in MapLibre, `.leaflet-marker-icon`
in Leaflet. Da lì due regole, che qui sono costate due bug identici nello stesso
giorno (18/8/2026):

1. **Mai dichiarare `position` su un elemento passato al costruttore del marker.**
   La nostra regola ha la stessa specificità di quella della libreria e nel CSS
   bundlato vince perché viene dopo. In dev l'ordine dei fogli è diverso, quindi i
   test locali passano e il bug si vede solo in produzione.
2. **Mai riscrivere `className` su un marker già aggiunto alla mappa.** Le classi
   della libreria vengono messe *dopo* `addTo()`, e assegnare l'attributo intero le
   cancella. Si toccano solo le classi nostre, con `classList.add/remove/toggle`.
   Era il caso di `refreshMapMarkers`: cambiando filtro POI, 13 marker su 14
   perdevano `position:absolute`.

**Sintomo, riconoscibile a occhio:** i pin lasciano il tracciato, si dispongono **in
diagonale** e finiscono fuori mappa — in mare, nei progetti costieri. È l'elemento
che, perso l'`absolute`, rientra nel flusso del documento portandosi dietro la
`transform` che la libreria gli scrive addosso.

**Come non ricascarci:** quando cambia un filtro, ricostruire i layer (il metodo di
tg-guida con Leaflet) è più sicuro che ritoccare gli elementi a mano. Se si ritocca,
solo `classList` e `style.display`.

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

## Domini

| Host | Cosa fa |
|---|---|
| `365.tuscanytrail.it` | **Il sito.** È l'unico host che serve pagine, ed è il valore di `site` in `astro.config.mjs` |
| `cyclingintuscany.tuscanytrail.it` | 301 verso `365`, path e query conservati — è il vecchio host, in giro ci sono ancora link |
| `cyclingintuscany.com` e `www.` | 301 verso `365`, path e query conservati (regola nella zona `cyclingintuscany.com`) |
| `cycling-in-tuscany-astro.pages.dev` | Lo stesso build, ma il CMS non ci fa il login. Non si usa e non si dà in giro |

Il cutover del 27/8/2026 ha spostato il sito da `cyclingintuscany.tuscanytrail.it` a `365.tuscanytrail.it`: il nome dice cosa è il sito, cioè la costola che tiene vivo il Tuscany Trail negli undici mesi fuori evento. Cambiare host tocca **quattro** posti oltre alla repo, e saltarne uno non dà errore, dà un pezzo rotto:

1. il dominio personalizzato nel progetto Pages `cycling-in-tuscany-astro` (**dalla dashboard**: l'API risponde `10000: Authentication error` a ogni scrittura su Pages, e `wrangler` non ha un comando per i domini);
2. il record DNS nella zona `tuscanytrail.it` — `CNAME` proxato verso `cycling-in-tuscany-astro.pages.dev`;
3. gli `ALLOWED_DOMAINS` del worker del CMS (qui sotto), altrimenti `/admin/` si apre e il login muore;
4. il flusso di dati GA4 `G-FELFB9W37W`, che ha ancora l'URL vecchio.

**Le due regole di redirect si scrivono a mano dalla dashboard.** Il token API risponde `10000: Authentication error` su ogni scrittura ai ruleset, come su Pages, quindi non si automatizzano. Fatte il 27/8/2026, una per zona:

| Zona | When | Then |
|---|---|---|
| `tuscanytrail.it` | `(http.host eq "cyclingintuscany.tuscanytrail.it")` | 301 dinamico a `concat("https://365.tuscanytrail.it", http.request.uri.path)` |
| `cyclingintuscany.com` | `(http.host eq "cyclingintuscany.com") or (http.host eq "www.cyclingintuscany.com")` | 301 dinamico allo stesso `concat(...)` |

Tre cose che è costato scoprire, e che si ripresenteranno al prossimo cambio di dominio:

- **Il tipo dev'essere «Dynamic», non «Static».** Un redirect statico manda tutto sulla radice: `/itinerari/qualcosa/` finisce sulla home. Per chi naviga è peggio di non fare niente, e Google tratta un redirect verso una pagina non correlata come un soft 404, quindi non trasferisce nulla.
- **«Preserve query string» è una spunta separata**, e non è accesa di default: senza, le UTM muoiono e il traffico da newsletter e campagne diventa "direct". L'attribuzione è l'argomento con cui si rinnovano i partner.
- **La destinazione va portata a `365` in tutte e due le regole.** Lasciare che `cyclingintuscany.com` punti al vecchio terzo livello funziona, ma sono due salti al posto di uno.

**L'espressione del *When* deve nominare l'hostname esatto.** Allargarla alla zona `tuscanytrail.it` spegnerebbe anche `www.tuscanytrail.it`, che è il sito del Tuscany Trail.

Verifica, da rifare tale e quale al prossimo cambio — attesi un salto solo, path e query intatti:

```bash
curl -sL -o /dev/null -w '%{url_effective} | %{num_redirects} salti\n' \
  "https://cyclingintuscany.com/itinerari/?utm_source=prova"
```

## Autenticazione del CMS

Il login GitHub passa dal worker `bikepacking-cms-auth`, **condiviso con bikepacking.it** — non è duplicato per questo progetto, e il client secret vive lì dentro, mai nella repo.

Due cose da sapere quando il login smette di funzionare:

1. Il dominio da cui si apre `/admin/` deve stare negli `ALLOWED_DOMAINS` del worker, altrimenti risponde `UNSUPPORTED_DOMAIN`. Per questo progetto il dominio in lista è `365.tuscanytrail.it`: da `cycling-in-tuscany-astro.pages.dev` e da `cyclingintuscany.com` il CMS si apre ma il login non parte.

   È un Secret, e **i secret di Cloudflare non si rileggono** — né dall'API né dalla dashboard. Aggiungerne uno vuol dire riscrivere **tutta** la lista, quindi bisogna prima sapere cosa c'è dentro. Si scopre interrogando il worker un dominio alla volta: un `302` vuol dire ammesso, un `200` con `UNSUPPORTED_DOMAIN` vuol dire no.

   ```bash
   curl -s -o /dev/null -w '%{http_code}\n' \
     "https://bikepacking-cms-auth.account-fe1.workers.dev/auth?provider=github&site_id=DOMINIO"
   ```

   Al 27/8/2026 la lista è, in quest'ordine: `bikepacking.it`, `www.bikepacking.it`, `tuscanytrail.it`, `www.tuscanytrail.it`, `new.tuscanytrail.it`, `cyclingintuscany.tuscanytrail.it`, `365.tuscanytrail.it`. Le prime due sono di bikepacking.it e le tre di mezzo del sito Tuscany Trail: **cancellarle rompe il CMS di altri due siti.** Si riscrive con `wrangler secret put ALLOWED_DOMAINS --name bikepacking-cms-auth` leggendo il valore **da un file** (`< lista.txt`): scritto a mano nel prompt carica una stringa vuota e dice comunque «Success».

2. La org GitHub `advlabbik` ha attive le *OAuth App access restrictions*: la app di auth va approvata a livello di org.

## Il gate email e Brevo

Il form GPX degli itinerari passa da `functions/api/lead.js` e scrive **direttamente** su Brevo via API. **Dal 27/8/2026 il GPX non si scarica più in pagina: arriva via email** (decisione di Andrea) — la function iscrive il contatto e poi manda un'email transazionale da `365@tuscanytrail.it` (reply-to `collab@`) col **link di download in evidenza**. **Niente Ride with GPS**, né in pagina né nell'email — su TT365 non è sponsor (Andrea, 27/8), lo è sul Tuscany Trail, e i due progetti non si mescolano. **Niente allegato, ed è un vincolo di Brevo, non una scelta**: gli attachment accettano solo una whitelist di estensioni e `.gpx` non c'è (provato il 27/8, l'invio moriva con `send failed`); rinominare il file `.xml` romperebbe l'import sui ciclocomputer. Il path del GPX arriva dal client ma viene validato contro `/gpx/*.gpx` del nostro host, sennò chiunque potrebbe farci spedire email con link arbitrari a nome nostro. Impianto verificato end-to-end il 27/8/2026 mandando una submission vera al sito in produzione:

| | |
|---|---|
| Lista | **29 — "Cycling in Tuscany"**, ~1.220 iscritti |
| Attributi | i sei `CIT_*` (itinerario, consenso, lingua, area, tipo, difficoltà), tutti valorizzati |
| Mittente | **`365@tuscanytrail.it`** — sender id 10, creato e attivo dal 27/8/2026. Il collaudo qui sopra è stato fatto con `hello@` (id 9), prima dello swap |
| `funnel_code` | `cycling_tuscany` |

**Il consenso è OBBLIGATORIO su tutti e tre i form** (decisione di Andrea, 27/8/2026 — prima era facoltativo e chi non spuntava riceveva comunque il file): senza spunta non parte niente, né il contatto né il GPX né la richiesta di servizio, e la function risponde `consent required`. La spunta è `required` nel form **e** ricontrollata lato server nelle due function, perché il `required` dell'HTML si aggira in tre secondi con la console aperta. Il testo della checkbox dichiara lo scambio invece di far passare l'iscrizione per una cortesia facoltativa, non è mai pre-selezionata, e l'unsubscribe sta in ogni email. La privacy policy descrive i tre form e la base giuridica (consenso, art. 6(1)(a)).

**Non c'è double opt-in.** La function scrive con l'id lista dentro la chiamata, quindi il contatto entra subito: il documento del consenso è la spunta sul sito, non una mail di conferma. Se un giorno si vuole il DOI va cambiata la chiamata, non basta una impostazione in Brevo.

**Il mittente non è una proprietà della lista.** In Brevo le liste non hanno un mittente: ce l'hanno le campagne, le automazioni e il DOI. Alla data di scrittura sulla lista 29 **non è mai stato inviato niente** — le tre campagne che compaiono nelle sue statistiche sono campagne Tuscany Trail e TGE dove una persona della lista si è disiscritta, `sent: 0` su tutte e tre — e non esiste nessuna automazione. `365@tuscanytrail.it` è quindi la scelta da applicare alla prima campagna o automazione che nascerà. ⚠️ Su `sender_funnel_map` (DB marketing, id 7) è ancora registrato `hello@tuscanytrail.it`: quella riga va aggiornata a mano, sta fuori da questa repo.

**Il sito pubblica lo stesso indirizzo** (allineato il 27/8/2026): `site.config.ts` → `brand.email` è `365@tuscanytrail.it`, e da lì escono footer, privacy policy, cookie policy e affiliate disclosure, contatto GDPR compreso. Sono la stessa cosa di proposito: chi riceve la newsletter deve trovare sul sito il recapito da cui gli è arrivata, ed è il canale con cui esercita i diritti GDPR. **Se un giorno cambia il mittente, quella riga cambia con lui.** L'handle Instagram resta `@cyclingintuscany_official`: è un account vero, non un recapito.

**Nessuno è ancora passato di qui.** Al 27/8/2026 non esiste un solo contatto con l'attributo `CIT_ITINERARY`: i ~1.220 della lista vengono da una raccolta precedente, l'ultimo entrato il 19 giugno. L'impianto funziona, non è ancora stato usato.

**Le chiavi non sono nella repo** — `BREVO_API_KEY` e `BREVO_LIST_ID` stanno nelle env **production** di Cloudflare Pages, come secret. Sulle **preview non ci sono**, quindi lì la function risponde `{ok: true, demo: true}` senza chiamare Brevo: un test su un deploy di anteprima non prova niente. L'account ha l'allowlist IP: le chiamate API manuali vanno fatte dal VPS Hetzner, non dal Mac.

## Il form noleggio e tour (live dal 27/8/2026)

Il test di domanda deciso da Andrea il 18/8: due form su `/services/` (noleggio bici e tour su misura), gestiti da `functions/api/service-request.js` — notifica interna a `collab@tuscanytrail.it` con reply-to del richiedente, conferma automatica da `365@tuscanytrail.it`, tagging Brevo best-effort (`CIT_SERVICE`, `CIT_SERVICE_INFO`, creati in Brevo il 27/8/2026). **La seconda risposta è sempre manuale**: prima si sentono i partner, poi si risponde — mai un no automatico, e le richieste in zona Punta Ala si girano a PuntAla Camp che il noleggio ce l'ha già. Template delle risposte, regole, checklist di setup e cosa misurare in [`docs/servizi-noleggio-tour.md`](docs/servizi-noleggio-tour.md); contesto business nel doc Notion "TT365 — Richieste noleggio e tour: test della domanda": https://app.notion.com/p/3c0f88ad0121818ea1a2fbb686aa72e9

## Decisioni ecosistema — 16 agosto 2026

Analisi completa dei 4 progetti digitali e registro decisioni con le motivazioni nella pagina Notion [Ecosistema App BAS — analisi e registro decisioni](https://app.notion.com/p/3bef88ad0121819487aceb41d1a89781). Qui solo ciò che tocca questo repo.

- **~~PRIORITÀ 1~~ FATTO (24/8), verificato end-to-end il 27/8** — vedi [Il gate email e Brevo](#il-gate-email-e-brevo) qui sopra per lista, mittente, consenso e trappole.
- **~~Privacy policy da riscrivere~~ FATTO (27/8)** — la sezione "this site has no forms" era falsa da quando il gate è live; ora descrive i tre form (GPX, noleggio, tour), il consenso obbligatorio come base giuridica, Brevo come responsabile del trattamento e il diritto di revoca. Resta da sistemare il paragrafo Airbnb nella affiliate disclosure.
- **UTM anche nei bottoni partner dentro il RouteViewer** — oggi i "Book …" di popup e card usano l'URL grezzo del JSON — traffico non attribuito, e il report di attribuzione è l'argomento di rinnovo dei partner.
- **Stay22 — si resta, si negozia lo split** — Booking ha chiuso gli affiliati diretti sotto €1k/mese (giu 2025), 37 delle nostre 38 prenotazioni sono Booking, e nessun altro ha l'embed lungo-GPX multi-OTA. Call post-evento TG col dossier dati per salire dal tier d'ingresso (30%) + domanda Airbnb-dentro-l'embed. `src/lib/stay22.ts` è il candidato a modulo condiviso per le app evento.
