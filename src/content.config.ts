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
      ridePack: z.array(Route).nullable(),
      magazine: z
        .object({
          heroTitle: z.string(),
          boxes: z.array(z.object({ titolo: z.string(), testo: z.string() })),
          fonte: z.string().optional(),
        })
        .nullable(),
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
    }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
  }),
});

export const collections = {
  territori,
  strutture,
  faq,
};
