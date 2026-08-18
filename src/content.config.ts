import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const Route = z.object({
  name: z.string(),
  type: z.enum(['Gravel', 'Road']),
  km: z.string(),
  dislivello: z.string(),
  diff: z.string(),
  surface: z.string(),
  hi: z.string(),
  url: z.string().url(),
  /** pagina itinerario interna: se c'è, la card porta lì e non più fuori su RwGPS */
  page: z.string().optional(),
});

const territori = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/territori' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      tier: z.enum(['premium', 'standard']),
      area: z.string(),
      tagline: z.string(),
      intro: z.string(),
      /** sottotitolo della sezione "What to see" — era itinerari_txt nel prototipo */
      itinerariTxt: z.string(),
      coords: z.object({ lat: z.number(), lng: z.number() }),
      heroImage: image().optional(),
      cosaVedere: z.array(
        z.object({
          titolo: z.string(),
          descrizione: z.string(),
          image: image().optional(),
        }),
      ),
      /**
       * `.default(null)` perché il CMS omette del tutto le liste e gli oggetti
       * facoltativi lasciati vuoti: senza default, un territorio salvato dal form
       * senza ride pack farebbe fallire il build con «Required».
       */
      ridePack: z.array(Route).nullable().default(null),
      magazine: z
        .object({
          heroTitle: z.string(),
          boxes: z.array(z.object({ titolo: z.string(), testo: z.string() })),
          fonte: z.string().optional(),
        })
        .nullable()
        .default(null),
      channels: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
      numeriUtili: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
      /** opzionale dal 15/8: la guida non si scarica più, i contenuti vivono
       *  nelle extraSections della pagina (decisione Andrea, come per i pack) */
      guidaPdf: z.string().optional(),
      /** sezioni con i contenuti della guida territorio, stesse card generiche
       *  delle strutture — titolo + sub + card label/text */
      extraSections: z
        .array(
          z.object({
            title: z.string(),
            sub: z.string().optional(),
            cards: z.array(z.object({ label: z.string(), text: z.string() })),
          }),
        )
        .default([]),
      /**
       * Mappa Stay22 embeddata in testa alla pagina territorio (Andrea, 15/8).
       * L'AID è `adventurelabsrl` (lo stesso della guida Trentino, quello che
       * incassa le commissioni al 30%) — è fissato nel template, qui solo
       * posizione, testi e campagna per l'attribuzione nel CSV Stay22.
       */
      /**
       * Mappa Trailforks di una bike area vicina (Andrea, 18/8). Serve dove la
       * bici da fare NON e' quella del sito: i sentieri li mantengono i rider
       * locali e la mappa e' la loro, sempre aggiornata, cosi' non copiamo
       * tracciati che cambiano. `rid` sta nello slug dell'URL Trailforks.
       */
      trailforksMap: z
        .object({
          rid: z.number(),
          href: z.string().url(),
          badge: z.string().optional(),
          title: z.string(),
          text: z.string(),
          note: z.string().optional(),
        })
        .nullable()
        .default(null),
      stay22Map: z
        .object({
          lat: z.number(),
          lng: z.number(),
          venue: z.string(),
          campaign: z.string(),
          badge: z.string().optional(),
          title: z.string(),
          text: z.string(),
        })
        .nullable()
        .default(null),
    }),
});

const strutture = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/strutture' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      town: z.string(),
      tagline: z.string(),
      intro: z.string(),
      site: z.string().url(),
      coords: z.object({ lat: z.number(), lng: z.number() }),
      heroImage: image().optional(),
      card: z.object({
        categoria: z.string(),
        promise: z.string(),
        bullets: z.array(z.string()),
        caption: z.string(),
        tint: z.string(),
      }),
      services: z.array(z.string()),
      ridePack: z.array(Route),
      /** facoltativo dal 15/8: i pack vivono nelle pagine, niente download */
      guidaPdf: z.string().optional(),
      /**
       * Contenuti del Ride Base Pack portati DENTRO la scheda (Andrea, 14/8):
       * aree di riding, itinerari-tipo, supporto tour operator, tips. Sezioni
       * generiche titolo + card, così ogni struttura può averne di sue.
       */
      extraSections: z
        .array(
          z.object({
            title: z.string(),
            sub: z.string().optional(),
            cards: z.array(z.object({ label: z.string(), text: z.string() })),
          }),
        )
        .default([]),
    }),
});

/**
 * Prototipo "mini-guida" (branch prototipo-itinerari): un itinerario studiabile
 * dentro il sito — viewer con mappa + altimetria + POI — invece del solo link
 * esterno a Ride with GPS. La traccia e i POI NON stanno qui: vivono in
 * public/data/itinerari/<slug>.json, generati da script (come in tg-guida),
 * perché array di coordinate dentro Sveltia sarebbero ingestibili.
 */
const itinerari = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/itinerari' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      type: z.enum(['Gravel', 'Road']),
      area: z.string(),
      tagline: z.string(),
      intro: z.string(),
      km: z.string(),
      dislivello: z.string(),
      diff: z.string(),
      surface: z.string(),
      time: z.string(),
      heroImage: image().optional(),
      /**
       * La struttura partner da cui parte l'anello. Se c'è, la sezione dormire
       * mostra SOLO lei — chi paga la scheda non trova concorrenti in pagina
       * (Andrea, 14/8). Senza base (itinerari non legati a un partner, come la
       * futura pagina del Tuscany Trail) compaiono Stay22 + Airbnb.
       */
      base: z
        .object({ slug: z.string(), name: z.string(), site: z.string().url() })
        .nullable()
        .default(null),
      /** territorio (comune) a cui appartiene la route — per gli itinerari
       *  senza struttura partner, es. quelli di Monterotondo */
      territory: z.object({ slug: z.string(), name: z.string() }).nullable().default(null),
      highlights: z.array(z.string()),
      rwgpsUrl: z.string().url().optional(),
      /** GPX servito da public/, sbloccato dal gate email */
      gpx: z.string(),
      /**
       * Il contenuto del Ride Base Pack vive QUI, visibile nella pagina —
       * il PDF non si scarica più: l'unico download è il GPX (Andrea, 14/8).
       */
      goodToKnow: z.array(z.object({ label: z.string(), text: z.string() })).default([]),
      /** dati traccia+POI generati da script, serviti da public/ */
      trackData: z.string(),
      stay22Campaign: z.string(),
      /** centro della mappa Stay22, di norma il baricentro dell'anello.
       *  OBBLIGATORIO: un default geografico mandava la mappa a 30-80 km
       *  dal percorso senza che nessun build se ne accorgesse. */
      stay22Center: z.object({ lat: z.number(), lng: z.number() }),
    }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({
    /**
     * L'ordine in home è una proprietà del contenuto, non del nome file (#34):
     * dal CMS lo slug lo genera Sveltia da `question`, quindi ordinare per `id`
     * infilerebbe ogni FAQ nuova in mezzo alle altre in ordine alfabetico.
     */
    order: z.number().int(),
    question: z.string(),
    answer: z.string(),
  }),
});

export const collections = {
  territori,
  strutture,
  itinerari,
  faq,
};
