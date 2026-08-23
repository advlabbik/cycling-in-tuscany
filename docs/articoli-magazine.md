# Articoli del magazine sul sito

Branch `articoli-magazine`, aperta il 23/8/2026 sopra `servizi-noleggio-tour`
(non sopra `main`: le due cose vanno online insieme, e la nav le tocca entrambe
nello stesso punto).

Pilota di tre articoli portati dal magazine *Cycling in Tuscany* a pagine del
sito. Serve a rispondere a una domanda sola: quanto costa e cosa rende mettere
online il materiale editoriale che oggi vive solo dentro un PDF su Issuu.

## I due binari

Il campo `track` nel frontmatter distingue due cose che il sito deve trattare
in modo diverso:

- **`partner`** — l'articolo è un deliverable contrattuale. Il contratto di
  Monterotondo Marittimo, per dirne uno, prevede testualmente «articolo
  redazionale in inglese, pubblicato sul magazine e sui canali social». Questi
  pezzi esistono a prescindere dal traffico, e nel report al territorio contano
  come consegna.
- **`editorial`** — l'articolo risponde a una domanda che il pubblico cerca
  davvero, e si misura in visite, citazioni e lead.

Senza questo campo il report per territorio non si può generare da solo, che è
la condizione perché l'argomento di vendita B2B regga al primo rinnovo.

## La regola sul testo

**Il testo del magazine non si riscrive.** Il corpo dell'articolo è il markdown
del file e arriva parola per parola dai documenti di Luciano Coluccia. Sul testo
si è intervenuti solo così:

1. un titolo nuovo, scritto come la domanda che una persona digita davvero
   (i documenti sorgente non avevano un titolo);
2. sottotitoli `##` inseriti fra i paragrafi esistenti, senza cambiare una parola;
3. rimossi i marcatori di redazione rimasti nel testo (`[→ BOX]`) e riparata una
   sequenza di asterischi che la conversione aveva rotto.

Tutto il resto di ciò che serve a farsi trovare — risposta breve in cima, fatti,
FAQ, JSON-LD, link interni — vive nel **frontmatter** e viene renderizzato
*intorno* al testo. Se un giorno serve ottimizzare di più, si aggiunge
frontmatter: non si mettono le mani nella prosa.

Il perché della risposta breve in testa: gli studi 2026 sulle citazioni degli
assistenti AI dicono che circa il 44% delle citazioni viene dal primo 30% della
pagina, e la prosa del magazine parte sempre di lato, mai dalla risposta.

## Contenuto sponsorizzato

Se il frontmatter ha `sponsor`, la pagina lo dichiara in testa e in coda, e il
link al partner esce con `rel="sponsored"`. È la stessa regola che Ilaria aveva
posto per il magazine cartaceo: chi paga va detto.

## File

| Percorso | Cosa |
|---|---|
| `src/content/articoli/*.md` | i tre articoli |
| `src/content.config.ts` | collection `articoli` |
| `src/pages/articoli/index.astro` | indice (`/articoli/`) |
| `src/pages/articoli/[slug].astro` | pagina articolo |
| `public/admin/config.yml` | collection per il CMS |
| `src/layouts/Base.astro` | voce "Journal" in nav e footer |

## Aperto

- `val-orcia-cycling-loop.md` si ferma una frase prima della fine: il documento
  sorgente su Drive è troncato a metà dell'ultima riga. Non è stata inventata una
  chiusura — c'è un commento HTML nel file. La riga va ripresa dall'originale.
- Due articoli su tre non hanno immagine di apertura e usano il gradiente di
  default. Le foto ci sono su Drive (`Magazine Toscana/FOTO`), vanno scelte.
- Prima del go-live serve il sottodominio definitivo `365.tuscanytrail.it`: `site`
  in `astro.config.mjs`, `Sitemap:` in `public/robots.txt` e i canonical vanno
  spostati lì **prima** che le pagine siano indicizzate, non dopo.
