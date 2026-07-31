# Batch tecnico pre-go-live — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chiudere le issue tecniche rimaste prima del go-live (#41 pagina 404, #43 og:image, #45 MapLibre come dipendenza) più le pulizie repo della Fase 5 (#19): anchor `#percorsi`→`#routes`, residui italiani, file fuorvianti, disclosure affiliazione, font self-hosted.

**Architecture:** Sito statico Astro 7 con Content Collections, deploy su Cloudflare Pages (builda da `main`, preview su ogni branch). Ogni task è un branch + PR separata su `main`; la CI (`.github/workflows/ci.yml`) prova `npm ci` + `npm run build` su ogni PR. Non c'è framework di test: la verifica è il build + asserzioni `grep` sull'output in `dist/`.

**Tech Stack:** Astro 7, astro:assets (`getImage`/`<Image>`), @astrojs/sitemap, MapLibre GL 4.7, Cloudflare Pages.

## Global Constraints

- Node `22.12.0` (da `.nvmrc`); il build locale va lanciato con quella versione o superiore. La CI e Pages usano `.nvmrc`.
- Dipendenze: installare con `npm install <pkg>` una volta sola e poi **mai** rilanciare `npm install` a vuoto — riscrive il lockfile multipiattaforma (vedi #27/#28). Verifica con `npm ci` se in dubbio.
- Copy visibile all'utente: **inglese**. Commenti nel codice: italiano, stile del repo (spiegano il *perché*, citano le issue).
- Messaggi di commit: convenzione del repo `fix(#N): descrizione in italiano` / `chore(#N): …`, con trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- **Non toccare** `site.stay22Aid` in `site.config.ts`: il valore è sbagliato di proposito finché Andrea non conferma quello giusto (issue #19, voce 3).
- PR: una per task, base `main`, corpo con `Closes #N` dove applicabile e trailer `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- Dopo il merge di ogni PR: `git checkout main && git pull` prima di aprire il branch successivo (i task 2, 3, 6 e 7 toccano tutti `src/layouts/Base.astro`).

---

### Task 1: Pagina 404 (issue #41)

**Files:**
- Create: `src/pages/404.astro`
- Modify (solo se serve, vedi Step 3): `astro.config.mjs`

**Interfaces:**
- Consumes: `src/layouts/Base.astro` (props `title`, `description`)
- Produces: `dist/404.html`, che Cloudflare Pages serve automaticamente con status 404

- [ ] **Step 1: Branch**

```bash
git checkout main && git pull && git checkout -b fix/41-pagina-404
```

- [ ] **Step 2: Crea `src/pages/404.astro`**

```astro
---
import Base from '../layouts/Base.astro';
---

<Base
  title="Page not found — Cycling in Tuscany"
  description="This page does not exist or has moved."
>
  <div class="hero">
    <div class="wrap">
      <div class="kick">Error 404</div>
      <h1>Page not found</h1>
      <p class="lead">
        The page you are looking for does not exist or has moved. The routes,
        though, are still where they have always been.
      </p>
      <a class="btn gold" href="/" style="margin-top:20px;display:inline-block">Back to the homepage →</a>
    </div>
  </div>
</Base>
```

- [ ] **Step 3: Build e verifica**

```bash
npm run build
test -f dist/404.html && echo OK-404
grep -c "Page not found" dist/404.html   # atteso: >= 1
grep -o "404" dist/sitemap-0.xml || echo "OK: 404 fuori dalla sitemap"
```

Atteso: `OK-404`, almeno 1 occorrenza, e la sitemap **senza** la 404. Se invece la sitemap la include, aggiungere in `astro.config.mjs`:

```js
integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
```

e rilanciare il build per riverificare.

- [ ] **Step 4: Commit, push, PR**

```bash
git add src/pages/404.astro astro.config.mjs
git commit -m "fix(#41): aggiungi 404.astro — Pages smette di rispondere 200 sugli URL inesistenti

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push -u origin fix/41-pagina-404
gh pr create --title "fix(#41): pagina 404 — stop ai soft-404" --body "Closes #41

Senza \`404.html\` Cloudflare Pages serve la home con status 200 su qualunque URL inesistente: contenuto duplicato per i crawler. Astro genera \`dist/404.html\` da \`src/pages/404.astro\` e Pages la usa in automatico, senza configurazione.

Verificato: \`dist/404.html\` presente, sitemap invariata.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 5: Attendi CI verde e mergia**

```bash
gh pr checks --watch && gh pr merge --squash --delete-branch
```

Dopo il merge, verifica sulla preview di produzione: `curl -s -o /dev/null -w "%{http_code}" https://cycling-in-tuscany-astro.pages.dev/pagina-che-non-esiste/` → atteso `404` (dopo che il deploy di Pages è finito, ~2 min).

---

### Task 2: og:image (issue #43)

**Files:**
- Modify: `src/layouts/Base.astro` (frontmatter + head, righe 1–47)
- Modify: `src/pages/territori/[slug].astro:44` (chiamata a `<Base>`)
- Modify: `src/pages/strutture/[slug].astro:45` (chiamata a `<Base>`)

**Interfaces:**
- Consumes: `heroImage: image().optional()` dagli schemi di `src/content.config.ts` (tipo `ImageMetadata | undefined`)
- Produces: nuova prop opzionale di `Base.astro` — `ogImage?: ImageMetadata`, default l'hero del sito. Le rotte dinamiche la passano; la home e la 404 usano il default.

- [ ] **Step 1: Branch**

```bash
git checkout main && git pull && git checkout -b fix/43-og-image
```

- [ ] **Step 2: Frontmatter di `Base.astro`**

Aggiungere gli import e la prop. Il frontmatter diventa:

```astro
---
import '../styles/global.css';
import { Image, getImage } from 'astro:assets';
import logo from '../assets/images/logo.png';
import heroDefault from '../assets/images/hero.jpg';
import { site } from '../../site.config';

interface Props {
  title: string;
  description?: string;
  /** carica MapLibre solo dove serve davvero (oggi: la home) */
  maplibre?: boolean;
  /** JSON-LD schema.org della pagina (issue #11) */
  schema?: Record<string, unknown> | Record<string, unknown>[];
  /** immagine per le anteprime social (#43); default: l'hero del sito */
  ogImage?: ImageMetadata;
}

const { title, description = 'Cycling in Tuscany', maplibre = false, schema, ogImage = heroDefault } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site ?? Astro.url.origin).href;
// 1200×630 è il ritaglio che ogni piattaforma si aspetta; jpg e non webp perché
// alcuni scraper social (WhatsApp in testa) il webp non lo mostrano.
const ogImg = await getImage({ src: ogImage, width: 1200, height: 630, fit: 'cover', format: 'jpg' });
const ogImageUrl = new URL(ogImg.src, Astro.site ?? Astro.url.origin).href;
---
```

- [ ] **Step 3: Meta tag nel `<head>` di `Base.astro`**

Dopo la riga `<meta property="og:url" content={canonical} />` aggiungere:

```html
<meta property="og:image" content={ogImageUrl} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

e dopo `<meta name="twitter:description" content={description} />`:

```html
<meta name="twitter:image" content={ogImageUrl} />
```

- [ ] **Step 4: Le rotte dinamiche passano la loro hero**

In `src/pages/territori/[slug].astro`, la chiamata a `<Base>` diventa:

```astro
<Base title={`${territorio.data.name} — Cycling in Tuscany`} description={territorio.data.intro} schema={schema} ogImage={territorio.data.heroImage}>
```

In `src/pages/strutture/[slug].astro`:

```astro
<Base title={`${struttura.data.name} — Cycling in Tuscany`} description={struttura.data.intro} schema={schema} ogImage={struttura.data.heroImage}>
```

Nota: `heroImage` è `optional()` nello schema — quando è `undefined` il default `heroDefault` della destructure copre il buco. Nessun ternario necessario.

- [ ] **Step 5: Build e verifica**

```bash
npm run build
grep -o 'property="og:image" content="[^"]*"' dist/index.html
grep -o 'property="og:image" content="[^"]*"' dist/territori/campiglia-marittima/index.html
grep -o 'name="twitter:image"' dist/index.html
```

Atteso: URL **assoluti** (`https://cyclingintuscany.tuscanytrail.it/_astro/….jpg`), e l'og:image di Campiglia **diverso** da quello della home (usa la sua heroImage). Verificare anche che il file jpg referenziato esista in `dist/_astro/`.

- [ ] **Step 6: Commit, push, PR**

```bash
git add src/layouts/Base.astro src/pages/territori/[slug].astro src/pages/strutture/[slug].astro
git commit -m "fix(#43): og:image su tutte le pagine — hero della pagina, fallback di brand

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push -u origin fix/43-og-image
gh pr create --title "fix(#43): og:image — le condivisioni smettono di essere link nudi" --body "Closes #43

\`twitter:card=summary_large_image\` prometteva un'immagine che non c'era. Ora ogni pagina ha \`og:image\` + \`twitter:image\` (1200×630, jpg, URL assoluto): territori e strutture usano la propria \`heroImage\`, home e 404 il fallback di brand.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 7: CI verde, merge**

```bash
gh pr checks --watch && gh pr merge --squash --delete-branch
```

---

### Task 3: MapLibre come dipendenza (issue #45)

**Files:**
- Modify: `package.json` / `package-lock.json` (nuova dipendenza `maplibre-gl`)
- Modify: `src/components/Map.astro` (frontmatter + script, righe 1–5 e 63–67)
- Modify: `src/layouts/Base.astro:38-45` (blocco `{maplibre && …}`)

**Interfaces:**
- Consumes: la prop `maplibre` di `Base.astro` resta (ora governa solo il preconnect a Carto); `index.astro:60` continua a passare `maplibre={true}` — non va toccato.
- Produces: `maplibregl` importato da modulo dentro lo script di `Map.astro`; CSS bundlato da Astro. Nessun riferimento a `unpkg.com` nell'HTML finale.

- [ ] **Step 1: Branch e installazione**

```bash
git checkout main && git pull && git checkout -b fix/45-maplibre-bundle
npm install maplibre-gl@^4.7.1
```

- [ ] **Step 2: `Map.astro` — importa libreria e CSS**

Nel frontmatter, dopo `import { bgUrl } from '../lib/images';` aggiungere:

```js
// #45: la libreria arriva dal bundle, non più da unpkg — versione nel lockfile,
// file serviti dal nostro dominio, niente CDN terza da cui dipendere.
import 'maplibre-gl/dist/maplibre-gl.css';
```

Nello script client, sostituire le prime righe:

```ts
(function () {
    var container = document.getElementById('map-el');
    if (!container || !(window as any).maplibregl) return;
    var maplibregl = (window as any).maplibregl;
```

con:

```ts
import maplibregl from 'maplibre-gl';

(function () {
    var container = document.getElementById('map-el');
    if (!container) return;
```

Il resto dello script resta identico (usa già la variabile `maplibregl`).

- [ ] **Step 3: `Base.astro` — via unpkg**

Il blocco condizionale diventa solo il preconnect a Carto (lo stile della mappa base resta remoto):

```astro
{maplibre && <link rel="preconnect" href="https://basemaps.cartocdn.com" />}
```

Spariscono: `preconnect` a `unpkg.com`, `<link rel="stylesheet" href="https://unpkg.com/…">`, `<script src="https://unpkg.com/…">`.

- [ ] **Step 4: Build e verifica**

```bash
npm run build
grep -rn "unpkg" dist/index.html && echo "FAIL: unpkg ancora presente" || echo "OK: niente unpkg"
grep -rl "maplibre" dist/_astro/*.js | head -3   # il bundle JS contiene la libreria
grep -c "maplibregl-map\|maplibre" dist/_astro/*.css | grep -v ":0" | head -3   # e il CSS
```

Atteso: nessun `unpkg` nell'HTML; almeno un bundle JS e un CSS con dentro MapLibre.

- [ ] **Step 5: Verifica visiva sulla preview del branch**

Dopo il push (step 6), aprire la preview di Cloudflare Pages del branch e controllare che la mappa in home si veda con i pin e i popup funzionanti. In alternativa in locale: `npm run preview` e aprire `http://localhost:4321/#map`.

- [ ] **Step 6: Commit, push, PR**

```bash
git add package.json package-lock.json src/components/Map.astro src/layouts/Base.astro
git commit -m "fix(#45): MapLibre nel bundle, via la dipendenza da unpkg

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push -u origin fix/45-maplibre-bundle
gh pr create --title "fix(#45): MapLibre come dipendenza bundlata" --body "Closes #45

MapLibre non arriva più da unpkg (nessun SRI, nessun fallback, versione fuori dal lockfile): è una dipendenza npm bundlata da Astro e servita dal nostro dominio. Spariscono il preconnect a unpkg e il problema di integrità. Resta il preconnect a Carto per lo stile della mappa base.

Verificato: build senza riferimenti a unpkg, mappa funzionante sulla preview.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 7: CI verde, verifica preview (step 5), merge**

```bash
gh pr checks --watch && gh pr merge --squash --delete-branch
```

---

### Task 4: Pulizie — anchor `#routes`, residui italiani, file fuorvianti (issue #19, voci 1–2)

**Files:**
- Modify: `src/pages/territori/[slug].astro:54` (ribbon) e `:95` (anchor)
- Modify: `src/pages/strutture/[slug].astro:70` (anchor)
- Modify: `src/pages/index.astro:118` (link `#percorsi`)
- Modify: `src/components/Map.astro:32,44` (campo `rp`)
- Delete: `src/assets/images/_FOTO-DA-INSERIRE.md`
- Delete: `src/assets/images/DJI_20260522195241_0458_D.jpg`

**Interfaces:**
- Consumes: niente dai task precedenti.
- Produces: l'anchor delle sezioni percorsi si chiama `routes` ovunque (sezioni **e** link, devono cambiare insieme o i deep-link si rompono).

- [ ] **Step 1: Branch**

```bash
git checkout main && git pull && git checkout -b chore/19-pulizie-anchor-file
```

- [ ] **Step 2: Anchor `percorsi` → `routes` (4 file, 5 occorrenze)**

- `src/pages/territori/[slug].astro`: `<section id="percorsi"` → `<section id="routes"`
- `src/pages/strutture/[slug].astro`: `<section id="percorsi"` → `<section id="routes"`
- `src/pages/index.astro`: `` href={`/strutture/${slug}#percorsi`} `` → `` href={`/strutture/${slug}#routes`} ``
- `src/components/Map.astro` riga 32: `entry.data.ridePack?.length ? 'percorsi' : ''` → `entry.data.ridePack?.length ? 'routes' : ''`
- `src/components/Map.astro` riga 44: `rp: 'percorsi'` → `rp: 'routes'`

- [ ] **Step 3: Ultimo italiano visibile**

`src/pages/territori/[slug].astro:54`:

```astro
: <div class="ribbon std">Official territory</div>}
```

(era `Territorio ufficiale` — stessa dicitura già usata dai popup della mappa, `Map.astro:108`).

- [ ] **Step 4: Rimuovi i file fuorvianti**

```bash
git rm src/assets/images/_FOTO-DA-INSERIRE.md
git rm src/assets/images/DJI_20260522195241_0458_D.jpg
```

Contesto: `_FOTO-DA-INSERIRE.md` dice che senza foto la home mostra un gradiente, ma le foto ci sono tutte. `DJI_20260522195241_0458_D.jpg` è byte-per-byte identico a `hero.jpg` (stesso md5 `d5617a37…`) e **nessun** file lo referenzia (verificato con grep su `src/` e `public/admin/config.yml`). Le altre immagini non referenziate (`borgomediavale.jpg`, `DJI_0115/0116`, `biancane-trail`, `colline-metallifere`, cartella `monteortndo/`) restano: la decisione pubblicare-o-rimuovere è ancora aperta in #19.

- [ ] **Step 5: Build e verifica**

```bash
npm run build
grep -rn "percorsi" src/ && echo "FAIL: residui" || echo "OK: zero percorsi in src/"
grep -rn "Territorio ufficiale" src/ && echo "FAIL" || echo "OK"
grep -c 'id="routes"' dist/territori/monterotondo-marittimo/index.html   # atteso: 1
grep -c '#routes' dist/index.html   # atteso: >= 3 (card strutture + popup mappa nel JSON)
```

- [ ] **Step 6: Commit, push, PR**

```bash
git add -A
git commit -m "chore(#19): anchor #routes, via l'ultimo italiano visibile e i file fuorvianti

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push -u origin chore/19-pulizie-anchor-file
gh pr create --title "chore(#19): pulizie pre-go-live — anchor, residui IT, file morti" --body "Fase 5 (#19), voci 1 e 2:

- anchor \`#percorsi\` → \`#routes\` su sezioni e link (l'ultimo italiano negli URL)
- ribbon \`Territorio ufficiale\` → \`Official territory\` (l'ultimo italiano visibile)
- via \`_FOTO-DA-INSERIRE.md\` (fuorviante: le foto ci sono tutte)
- via \`DJI_20260522195241_0458_D.jpg\`, duplicato byte-per-byte di \`hero.jpg\`, mai referenziato

Le altre immagini non referenziate restano: la decisione è ancora aperta in #19.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 7: CI verde, merge**

```bash
gh pr checks --watch && gh pr merge --squash --delete-branch
```

---

### Task 5: Font self-hosted (issue #19, voce 7 — GDPR)

**Files:**
- Modify: `package.json` / `package-lock.json` (4 pacchetti `@fontsource/*`)
- Modify: `src/layouts/Base.astro` (frontmatter + head: via 3 `<link>` verso Google)

**Interfaces:**
- Consumes: le famiglie dichiarate in `src/styles/global.css:6-8` e `:67` — `Playfair Display` (600/700, normal+italic), `Caveat` (500), `DM Sans` (400/500), `JetBrains Mono` (400/500). I nomi `font-family` di Fontsource coincidono con quelli di Google Fonts: **`global.css` non va toccato**.
- Produces: font serviti da `/_astro/*.woff2`, zero richieste a `fonts.googleapis.com`/`fonts.gstatic.com`.

- [ ] **Step 1: Branch e installazione**

```bash
git checkout main && git pull && git checkout -b chore/19-font-self-hosted
npm install @fontsource/playfair-display @fontsource/caveat @fontsource/dm-sans @fontsource/jetbrains-mono
```

- [ ] **Step 2: Import in `Base.astro`**

Nel frontmatter, subito dopo `import '../styles/global.css';`:

```js
// #19: font self-hosted — l'IP dei visitatori non va più a Google al primo load,
// e spariscono due preconnect e una richiesta CSS bloccante.
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/600-italic.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/700-italic.css';
import '@fontsource/caveat/500.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
```

- [ ] **Step 3: Via i link a Google dal `<head>`**

Rimuovere le tre righe:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:…&display=swap" />
```

- [ ] **Step 4: Build e verifica**

```bash
npm run build
grep -rn "fonts.googleapis\|fonts.gstatic" dist/ && echo "FAIL: Google Fonts ancora presente" || echo "OK"
ls dist/_astro/*.woff2 | wc -l   # atteso: > 0
```

Poi confronto visivo: `npm run preview`, aprire la home e una pagina territorio — titoli in Playfair, kick in Caveat, body in DM Sans, tag hero in JetBrains Mono. Se una famiglia cade sul fallback (Georgia/sans) l'occhio lo vede subito sui titoli.

- [ ] **Step 5: Commit, push, PR**

```bash
git add package.json package-lock.json src/layouts/Base.astro
git commit -m "chore(#19): font self-hosted via Fontsource — via Google Fonts

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push -u origin chore/19-font-self-hosted
gh pr create --title "chore(#19): font self-hosted — l'IP dei visitatori resta a casa" --body "Fase 5 (#19), voce 7 (parte GDPR): i font arrivavano da fonts.googleapis.com/fonts.gstatic.com, cioè l'IP di ogni visitatore europeo andava a Google al primo caricamento. Ora sono bundlati con Fontsource e serviti dal nostro dominio. Bonus: via due preconnect e una richiesta CSS bloccante.

Stesse famiglie, stessi pesi (Playfair 600/700 ±italic, Caveat 500, DM Sans 400/500, JetBrains Mono 400/500): \`global.css\` intatto.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 6: CI verde, verifica visiva sulla preview del branch, merge**

```bash
gh pr checks --watch && gh pr merge --squash --delete-branch
```

---

### Task 6: Disclosure affiliazione (issue #19, voce 7)

**Files:**
- Create: `src/pages/affiliate-disclosure.astro`
- Modify: `src/layouts/Base.astro` (footer, righe 82–88)

**Interfaces:**
- Consumes: `Base.astro` (props `title`, `description`), `site.brand.email` da `site.config.ts`
- Produces: rotta `/affiliate-disclosure/`, linkata dal footer di ogni pagina

- [ ] **Step 1: Branch**

```bash
git checkout main && git pull && git checkout -b chore/19-affiliate-disclosure
```

- [ ] **Step 2: Crea `src/pages/affiliate-disclosure.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import { site } from '../../site.config';
---

<Base
  title="Affiliate disclosure — Cycling in Tuscany"
  description="How Cycling in Tuscany earns money: some accommodation links are affiliate links."
>
  <div class="hero">
    <div class="wrap">
      <div class="kick">Transparency</div>
      <h1>Affiliate disclosure</h1>
      <p class="lead">How this site earns money, in plain words.</p>
    </div>
  </div>

  <section>
    <div class="wrap" style="max-width:760px">
      <h2 class="sec">Accommodation links</h2>
      <p>
        Some links on this site — the “Find accommodation” and “Other stays in the
        area” buttons — go through <strong>Stay22</strong>, an affiliate platform.
        If you book a stay after following one of those links, we may earn a
        commission. <strong>You pay exactly the same price</strong>: the commission
        comes from the booking platform, not from your pocket.
      </p>
      <p>
        Direct booking links to the official stays (“Book with …”) point to the
        property's own website and are <strong>not</strong> affiliate links: we earn
        nothing from them.
      </p>
      <h2 class="sec" style="margin-top:34px">Why we do it this way</h2>
      <p>
        Affiliate commissions are what keeps this site running — the routes, the
        guides and the maps are free, and there is no advertising and no paywall.
        We only list territories and stays we have verified ourselves.
      </p>
      <p>
        Questions? Write to <a href={`mailto:${site.brand.email}`}>{site.brand.email}</a>.
      </p>
    </div>
  </section>
</Base>
```

- [ ] **Step 3: Link nel footer di `Base.astro`**

La riga dei link del footer diventa:

```astro
<a href="/">Home</a> · <a href="/affiliate-disclosure/">Affiliate disclosure</a> · <a href={`mailto:${site.brand.email}`}>{site.brand.email}</a> · Instagram {site.brand.instagram}
```

- [ ] **Step 4: Build e verifica**

```bash
npm run build
test -f dist/affiliate-disclosure/index.html && echo OK-pagina
grep -c "affiliate-disclosure" dist/index.html          # atteso: >= 1 (link nel footer)
grep -c "affiliate-disclosure" dist/sitemap-0.xml       # atteso: 1
grep -c "Stay22" dist/affiliate-disclosure/index.html   # atteso: >= 1
```

- [ ] **Step 5: Commit, push, PR**

```bash
git add src/pages/affiliate-disclosure.astro src/layouts/Base.astro
git commit -m "chore(#19): pagina di disclosure affiliazione, linkata dal footer

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push -u origin chore/19-affiliate-disclosure
gh pr create --title "chore(#19): disclosure affiliazione Stay22" --body "Fase 5 (#19), voce 7: i link Stay22 sono la fonte di ricavo del sito e non erano dichiarati da nessuna parte — la disclosure è richiesta dai programmi di affiliazione stessi, prima ancora che dalla legge. Nuova pagina \`/affiliate-disclosure/\` (inglese, tono del sito), linkata dal footer di ogni pagina.

Privacy/cookie policy restano una voce aperta in #19: dipendono dalla scelta dell'analitica.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 6: CI verde, merge**

```bash
gh pr checks --watch && gh pr merge --squash --delete-branch
```

---

## Chiusura del batch

- [ ] Dopo l'ultimo merge: `git checkout main && git pull`, poi `npm run build` finale di conferma.
- [ ] Commentare su #19 spuntando le voci chiuse (anchor, file fuorvianti, disclosure, font) e aggiornare l'epic #6 se serve.
- [ ] Le issue #41, #43, #45 si chiudono da sole con i `Closes` delle PR.

## Fuori scope (deciso, non dimenticato)

- `stay22Aid` sbagliato → aspetta Andrea (#19, voce 3) — **blocco vero al go-live**
- Analitica, booking Monterotondo, ride pack Campiglia, foto non referenziate → decisioni aperte in #19
- Privacy/cookie policy → dipende dalla scelta dell'analitica
- Cutover dominio → passaggi manuali di Francesco in dashboard (#18)
