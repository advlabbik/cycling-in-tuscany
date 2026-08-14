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
      guidaPdf: z.string(),
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
      guidaPdf: z.string(),
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
      /** la struttura partner da cui parte l'anello */
      base: z.object({ slug: z.string(), name: z.string(), site: z.string().url() }),
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
      /** centro della mappa Stay22, di norma il baricentro dell'anello */
      stay22Center: z.object({ lat: z.number(), lng: z.number() }).default({ lat: 43.01, lng: 10.63 }),
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
