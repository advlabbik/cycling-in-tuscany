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
├─ content/            # LA fonte dati — territori, strutture, faq (Content Collections)
├─ content.config.ts   # schema Zod delle collezioni
├─ assets/images/      # immagini ottimizzate da astro:assets
├─ components/         # Map.astro, card, sezioni
├─ layouts/Base.astro  # head, SEO, nav, footer
└─ pages/              # index + rotte dinamiche /territori/[slug] e /strutture/[slug]
public/
├─ admin/              # Sveltia CMS: index.html + config.yml
└─ guide-pdf/          # PDF serviti così come sono, fuori da astro:assets
site.config.ts         # aid Stay22, brand, centro mappa, ordine strutture in home
docs/fonti/            # brief, sorgenti magazine, dati partner del vecchio prototipo
```

**Le immagini vanno in `src/assets/images/`, non in `public/`.** I `.md` le referenziano con path relativo (`../../assets/images/x.jpg`): è l'unica forma che `image()` di `astro:assets` risolve, e il CMS è configurato per scrivere esattamente quella. Un path assoluto tipo `/images/x.jpg` fa fallire il build con `ImageNotFound`. I PDF invece stanno in `public/guide-pdf/` proprio perché **non** devono passare dalla pipeline di ottimizzazione.

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
