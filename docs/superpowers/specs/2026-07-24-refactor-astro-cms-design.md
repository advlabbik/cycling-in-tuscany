# Refactor su Astro + Sveltia CMS — Design Spec

- **Data:** 2026-07-24
- **Stato:** approvato (design) — pronto per il piano di implementazione
- **Repo:** `advlabbik/cycling-in-tuscany`
- **Autori:** Francesco + Claude

> **Nota per chi implementa (incluso un agent / Claude Code su modelli piccoli):**
> Questo documento è auto-contenuto. Path, schema e criteri di verifica sono espliciti apposta.
> Il sito **oggi** è un prototipo HTML statico generato da Python (`build_pages.py`) a partire
> da `_dati-partner.json`. Quel prototipo è il **riferimento di layout, testi e stile da preservare**.
> Non inventare struttura o contenuti nuovi: portali dal prototipo, migliorando solo i punti
> elencati in §8 (migliorie della review). In caso di dubbio su un contenuto, la fonte di verità
> è `_dati-partner.json` + i literal hardcoded in `build_pages.py` (vedi §7).

---

## 1. Obiettivo

Rifondare il sito come applicazione **Astro** (output statico), **preservando** layout, markup, CSS
(`assets/style.css`) e testi del prototipo, e integrando le migliorie della review dove tocchiamo le
parti interessate. Il refactor:

- elimina la **doppia fonte dati** (`_dati-partner.json` editato a mano **vs** literal Python in `build_site.py`) e il **rebuild distruttivo** che ne consegue;
- rende i contenuti gestibili da una **UI a form** (Sveltia CMS), con foto/PDF caricabili da media library;
- porta il deploy su **Cloudflare Pages** con preview automatici per branch.

### Non-obiettivi (fuori scope di questo spec)

- **Traduzione IT→EN** dei contenuti (issue #1): il nuovo modello la rende banale (si editano i file), ma è lavoro di contenuto a sé.
- **Overlay tracce GPX** sulla mappa (issue #4, fase 2 dichiarata nel brief).
- **Multi-utente / permessi CMS**: editano solo i due tecnici del team. Niente ruoli.
- **Redesign**: il look resta quello del prototipo. Si toccano solo i punti in §8.

---

## 2. Stack e motivazione

| Layer | Scelta | Perché |
|---|---|---|
| Framework | **Astro** (static output) | SSG moderno, Content Collections native con schema validato, ottimizzazione immagini integrata. Stesso stack di `bikepacking-static`. |
| Fonte dati | **Astro Content Collections** (Markdown + frontmatter, schema Zod) | Fonte unica, validata al build, editabile da un CMS git-based. |
| CMS | **Sveltia CMS** | Git-based, form da config, media library. Già in uso su `bikepacking-static` → un solo CMS da conoscere in tutta BAS. |
| Auth CMS | **GitHub OAuth App** + worker **`sveltia-cms-auth`** su Cloudflare | Standard Sveltia. Il secret vive nel worker, non nella repo. **Riusare il worker già attivo per `bikepacking-static`** (un worker può servire più siti): aggiungere solo la callback per questo dominio. |
| Deploy | **Cloudflare Pages** | `main` = produzione, ogni branch/PR = preview deploy. Stesso pattern di `bikepacking-static`. |

Publish mode CMS: **commit diretti** (gli editor sono tecnici e usano git per i branch quando serve una preview). `editorial_workflow` resta un'opzione da attivare in futuro.

> **Punto di manutenzione noto:** lo schema Zod (§4) e la config Sveltia (§5) descrivono la stessa
> struttura in due file diversi. Vanno tenuti allineati a mano quando il modello dati evolve.

---

## 3. Struttura della repo (target)

```
cycling-in-tuscany/
├─ src/
│  ├─ content/
│  │  ├─ territori/            # 1 .md per territorio
│  │  │  ├─ campiglia-marittima.md
│  │  │  └─ monterotondo-marittimo.md
│  │  ├─ strutture/            # 1 .md per struttura
│  │  │  ├─ punta-ala.md
│  │  │  ├─ villaggio-orizzonte.md
│  │  │  └─ villa-toscana.md
│  │  └─ faq/                  # risposte FAQ (data) — vedi §8 #9
│  │     └─ faq.md  (oppure faq.yml)
│  ├─ content.config.ts        # schema Zod delle collezioni (§4)
│  ├─ assets/images/           # foto (ottimizzate da astro:assets)
│  ├─ components/              # componenti Astro portati dal prototipo (§6)
│  ├─ layouts/                 # layout condivisi (head, nav, footer)
│  └─ pages/
│     ├─ index.astro           # home
│     ├─ territori/[slug].astro
│     └─ strutture/[slug].astro
├─ public/
│  ├─ admin/                   # Sveltia CMS (index.html + config.yml) — §5
│  └─ guide-pdf/               # i PDF scaricabili (già esistenti nel prototipo)
├─ site.config.ts             # config globale: aid Stay22, campaign, brand footer, mappa (§4.4)
├─ astro.config.mjs
├─ _prototipo/                 # il prototipo statico attuale, spostato qui come RIFERIMENTO
│  └─ (index.html, build_pages.py, assets/, ecc.)
└─ docs/superpowers/specs/2026-07-24-refactor-astro-cms-design.md   # questo file
```

> Il prototipo attuale va **spostato in `_prototipo/`** all'inizio della migrazione (non cancellato):
> serve come sorgente di markup/CSS/testi e come confronto visivo. Si rimuove solo quando il nuovo
> sito è a pari funzionalità (task finale dell'epic).

---

## 4. Modello dati (Astro Content Collections)

Due collezioni, **un file Markdown per partner**: campi strutturati nel frontmatter, testo editoriale
nel body. Lo schema Zod valida al build.

### 4.1 Tipo condiviso `Route` (percorso Ride with GPS)

```ts
const Route = z.object({
  name: z.string(),
  type: z.enum(['Gravel', 'Road']),
  km: z.string(),              // stringa: nel prototipo compaiono valori come "79,6"
  dislivello: z.string(),      // es. "1.079 m"
  diff: z.string(),            // es. "Impegnativo" (da tradurre in EN — issue #1)
  surface: z.string(),         // es. "gravel · e-bike consigliata"
  hi: z.string(),              // highlight / punti salienti
  url: z.string().url(),       // URL Ride with GPS — INCLUDE ?privacy_code=... quando presente. NON rimuoverlo.
});
```

### 4.2 Collezione `territori`

```ts
const territori = defineCollection({
  type: 'content',            // Markdown: il body = l'articolo magazine
  schema: ({ image }) => z.object({
    name: z.string(),
    tier: z.enum(['premium', 'standard']),   // premium = Campiglia (oro). Guida la gerarchia visiva.
    area: z.string(),
    tagline: z.string(),
    intro: z.string(),
    coords: z.object({ lat: z.number(), lng: z.number() }),
    heroImage: image().optional(),
    cosaVedere: z.array(z.object({
      titolo: z.string(),
      descrizione: z.string(),               // può contenere <em> (HTML inline) — vedi nota escaping §4.5
      image: image().optional(),
    })),
    ridePack: z.array(Route).nullable(),      // Campiglia: null. Monterotondo: 4 route.
    magazine: z.object({                      // il "magazine" del territorio; il corpo articolo è nel body .md
      heroTitle: z.string(),
      boxes: z.array(z.object({ titolo: z.string(), testo: z.string() })),
      fonte: z.string().optional(),
    }).nullable(),
    channels: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
    numeriUtili: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
    guidaPdf: z.string(),                     // path assoluto dalla root, es. "/guide-pdf/Guida-Campiglia-Marittima.pdf"
  }),
});
```

### 4.3 Collezione `strutture`

```ts
const strutture = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    name: z.string(),
    town: z.string(),
    tagline: z.string(),
    intro: z.string(),
    site: z.string().url(),                   // sito di prenotazione diretta della struttura
    coords: z.object({ lat: z.number(), lng: z.number() }),
    heroImage: image().optional(),
    card: z.object({                          // copy marketing della card in home (oggi HARDCODED in build_pages.py §7)
      categoria: z.string(),                  // es. "Bike Resort & Trail Center"
      promise: z.string(),
      bullets: z.array(z.string()),
      caption: z.string(),                    // didascalia foto
      tint: z.string(),                       // HSL della card, es. "34 55% 18%"
    }),
    services: z.array(z.string()),
    ridePack: z.array(Route),                 // 4 route
    guidaPdf: z.string(),                     // path assoluto, es. "/guide-pdf/Ride-Base-Pack-Punta-Ala.pdf"
  }),
});
```

### 4.4 `site.config.ts` (config globale, NON una collezione)

```ts
export const site = {
  stay22Aid: '694570b3581ec595fca56708',   // ⚠️ issue #2: verificare che sia l'account di Andrea prima del live
  stay22Campaign: 'tuscanytrail',
  brand: {
    email: 'hello@cyclingintuscany.com',
    instagram: '@cyclingintuscany_official',
  },
  map: { center: [10.68, 42.98], zoom: 9 }, // valori dal prototipo (build_pages.py)
};
```

> L'`aid` Stay22 **non è un segreto** (finisce nell'URL pubblico), quindi sta nel config versionato.
> Il valore vive **in un solo posto**: cambiarlo (issue #2) = 1 riga.

### 4.5 Nota escaping

Alcuni campi contengono HTML inline voluto (es. `cosaVedere[].descrizione` con `<em>`, il body magazine).
Renderizzali come HTML **solo** per i campi documentati come tali; per i campi testuali semplici (name, town,
km, hi, service) usa l'escaping di default di Astro. (Nel prototipo Python nessun campo era escapato — è un
rischio da chiudere in Astro, che escapa di default.)

---

## 5. Sveltia CMS

### 5.1 File

- `public/admin/index.html` — carica Sveltia CMS.
- `public/admin/config.yml` — backend + collezioni. Deve **rispecchiare** lo schema Zod di §4 (punto di manutenzione: schema e config vanno tenuti allineati a mano quando il modello evolve).

### 5.2 Config (scheletro)

```yaml
backend:
  name: github
  repo: advlabbik/cycling-in-tuscany
  branch: main
  base_url: <URL del worker sveltia-cms-auth riusato da bikepacking-static>

media_folder: "src/assets/images"
public_folder: "/src/assets/images"     # verificare mapping con astro:assets in fase di implementazione

collections:
  - name: territori
    folder: "src/content/territori"
    create: true
    fields:
      - { name: name, widget: string }
      - { name: tier, widget: select, options: [premium, standard] }
      - { name: area, widget: string }
      - { name: tagline, widget: string }
      - { name: intro, widget: text }
      - { name: coords, widget: object, fields: [
            { name: lat, widget: number, value_type: float },
            { name: lng, widget: number, value_type: float } ] }
      - { name: heroImage, widget: image, required: false }
      - { name: cosaVedere, widget: list, fields: [
            { name: titolo, widget: string },
            { name: descrizione, widget: text },
            { name: image, widget: image, required: false } ] }
      - { name: ridePack, widget: list, required: false, fields: [ <campi Route> ] }
      - { name: magazine, widget: object, required: false, fields: [
            { name: heroTitle, widget: string },
            { name: boxes, widget: list, fields: [ { name: titolo, widget: string }, { name: testo, widget: text } ] },
            { name: fonte, widget: string, required: false } ] }
      - { name: channels, widget: list, required: false, fields: [ { name: label, widget: string }, { name: url, widget: string } ] }
      - { name: numeriUtili, widget: list, required: false, fields: [ { name: label, widget: string }, { name: value, widget: string } ] }
      - { name: guidaPdf, widget: file }
      - { name: body, widget: markdown }     # l'articolo magazine
  - name: strutture
    folder: "src/content/strutture"
    create: true
    fields: [ <mappa i campi di §4.3 con gli stessi widget> ]
```

### 5.3 Auth & deploy

- **GitHub OAuth App**: registrare (o riusare) l'OAuth App; callback → il worker `sveltia-cms-auth`.
- **Worker `sveltia-cms-auth`**: riusare quello di `bikepacking-static`; aggiungere il dominio di questo sito tra gli allowed origins.
- **Cloudflare Pages**: collegare la repo, build `astro build`, output `dist/`. `main` = produzione, branch/PR = preview.
- **Dominio**: sottodominio dedicato (il brief dice "vive su un sottodominio"). Host esatto deciso al deploy.

---

## 6. Porting del layout

Portare il markup e `assets/style.css` del prototipo in componenti/layout Astro **preservando il look**:

- `layouts/Base.astro` ← `head()` + `nav()` + `footer()` di `build_pages.py` (righe 14-88).
- `components/RouteCard.astro` ← `loop_card()` (righe 90-110), **inclusa** la logica di estrazione `route_id`/`privacy_code` per la preview `full.png?privacy_code=` (righe 92-101).
- `components/Map.astro` ← blocco MapLibre della home (righe 448-476); i **marker vengono dai dati** delle collezioni (oggi `markers=[]`, righe 264-277).
- `pages/index.astro` ← home (righe 279-446): hero, feature Campiglia, stays, mappa, territori (carosello), magazine teaser, FAQ.
- `pages/territori/[slug].astro` ← `build_territory()` (righe 140-173).
- `pages/strutture/[slug].astro` ← `build_structure()` (righe 175-205).

Il CSS può restare un unico `style.css` importato dal layout, oppure essere spezzato per componente a
discrezione di chi implementa — **purché il rendering resti identico** al prototipo.

---

## 7. Migrazione dei contenuti

Uno **script una-tantum** (`scripts/migrate.mjs`, poi cancellato) che legge:

1. `_prototipo/_dati-partner.json` — i campi strutturati dei 5 partner;
2. i **literal hardcoded** in `_prototipo/build_pages.py`:
   - `COSA_VEDERE_IMGS` (righe 123-138) → campo `cosaVedere[].image`;
   - `SC` (righe 216-226) → campo `card` delle strutture (`categoria`, `promise`, `bullets`, `caption`);
   - `DCARD_TC` (righe 230-234) → campo `card.tint`;
   - `TER_IMG` / `STR_IMG` (righe 8-9) → campo `heroImage`.

e scrive i **5 file** `.md` delle collezioni. Il body `.md` dei territori riceve l'articolo magazine
(`editorial.hero_html` per Monterotondo; vuoto per Campiglia).

> **Attenzione refuso "load-bearing":** nel prototipo la cartella immagine di Monterotondo è
> `images/monteortndo/` (manca la "r"). In migrazione **rinominare** in `monterotondo/` e aggiornare
> il riferimento. (Vedi issue #13.)

Stato lingua post-migrazione: Campiglia già EN; Monterotondo + 3 strutture in IT → traduzione = issue #1.

---

## 8. Migliorie della review da integrare (contestuali al porting)

| # | Miglioria | Come si chiude col refactor |
|---|---|---|
| #8 | PDF strutture rotti (`../../guide-pdf/`) | `guidaPdf` = path **assoluto** `/guide-pdf/…` → risolto per costruzione |
| #9 | FAQ senza risposte | Scrivere le **8 risposte** nella collezione `faq` e renderizzarle nell'accordion |
| #10 | Magazine non renderizzato | Il `magazine` + body `.md` del territorio **vengono renderizzati** nel template territorio |
| #11 | SEO baseline | In `layouts/Base.astro`: `<meta description>` per pagina, Open Graph/Twitter, `canonical`; schema.org (`TouristDestination`/`LodgingBusiness`/`FAQPage`); `@astrojs/sitemap` per `sitemap.xml`; `public/robots.txt` |
| #12 | Accessibilità | Marker mappa come `<button>` focusabili con label (o lista accessibile equivalente); ripristinare `:focus-visible` visibile sulle FAQ; `aria-expanded`/`aria-hidden` sul menu burger |
| #13 | Polish | Refuso cartella (§7); colonna destra hero vuota → hero a colonna singola o glass-card ripristinata (niente CSS morto); oro riservato al premium (kicker generici neutri/bordeaux); tap target dots ≥44px; heading senza salti h2→h4 |

Fuori da questo blocco ma da tenere presenti: #2 (aid Stay22, §4.4), #3 (booking Monterotondo — decisione di contenuto), #5 (foto reali — droppare in `src/assets/images/`).

---

## 9. Fasi di implementazione

Ogni fase è un blocco di lavoro con **criteri di accettazione verificabili**. Diventeranno issue GitHub
(§10). Una fase può essere presa da un modello piccolo senza tenere in testa le altre.

### Fase 0 — Scaffold
- Spostare il prototipo in `_prototipo/`.
- `npm create astro`, aggiungere `@astrojs/sitemap`, configurare output statico.
- **Accettazione:** `astro build` gira e produce un `dist/` (anche solo con una pagina placeholder).

### Fase 1 — Modello dati + migrazione
- `content.config.ts` (§4), `site.config.ts` (§4.4).
- Script di migrazione (§7) → 5 file `.md` + immagini in `src/assets/images/` (cartella bonificata).
- **Accettazione:** `astro build` valida le collezioni senza errori di schema; i 5 file esistono; `getCollection('territori')` e `getCollection('strutture')` ritornano i dati attesi (2 e 3 elementi).

### Fase 2 — Porting layout + migliorie
- Layout, componenti e le 3 pagine (§6), preservando look e testi.
- Integrare le migliorie §8 mentre si tocca ciascuna parte.
- **Accettazione:** confronto visivo before/after col prototipo (screenshot delle 6 pagine) senza regressioni di look; tutti i link PDF (200, non 404), Ride with GPS (privacy_code intatti) e Stay22 (aid corretto, coords giuste) funzionano; Lighthouse ≥ target concordato su SEO e a11y.

### Fase 3 — CMS + deploy
- `public/admin/` (Sveltia config §5) allineato allo schema.
- Auth (worker riusato) + Cloudflare Pages + preview.
- **Accettazione:** login al CMS funziona; una modifica di prova a un partner via form produce un commit e un preview deploy; la produzione builda da `main`.

### Fase 4 — Cutover
- Rimuovere `_prototipo/` quando il nuovo sito è a pari funzionalità.
- **Accettazione:** il sito Astro è in produzione sul dominio; `_prototipo/` rimosso; README aggiornato con il nuovo flusso (edita collezione o CMS → build → deploy).

---

## 10. Riorganizzazione delle issue GitHub

Obiettivo: rendere il refactor **eseguibile a pezzi** da modelli piccoli. Struttura proposta:

- **Milestone** "Refactor Astro + CMS".
- **Epic** (issue #6 riusata o nuova): "Refactor su Astro + Sveltia CMS", con checklist che linka le sub-issue e questo spec.
- **Sub-issue = le fasi §9** (Fase 0…4), ognuna con i propri **acceptance criteria** copiati da §9 e le **dipendenze** (`blocked by` sulla fase precedente).
- **Issue assorbite** (#7, #8, #9, #10, #11, #12, #13): etichettate `superseded-by-epic`, chiuse quando la fase che le risolve è completata (il riferimento è nella tabella §8).
- **Issue che sopravvivono**: #1 (traduzione, `blocked by` Fase 1), #2 (aid, verifica in Fase 3/pre-live), #3 (booking Monterotondo), #4 (overlay GPX, fase 2 futura), #5 (foto reali).

Questa riorganizzazione è il **primo task dell'implementazione**, non parte del design.

---

## 11. Verifica (riepilogo)

- **Build**: `astro build` verde = schema dati valido.
- **Visivo**: screenshot before/after delle 6 pagine vs `_prototipo/`.
- **Link-check**: PDF (HTTP 200), Ride with GPS (privacy_code preservati), Stay22 (aid + coords).
- **Lighthouse**: SEO e accessibilità sopra la soglia concordata (baseline oggi assente).
- **CMS**: giro completo edita-via-form → commit → preview.
