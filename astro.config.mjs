// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // cycling-in-tuscany.pages.dev appartiene a un altro progetto (elcar/advlab-static-sites).
  // Al go-live (#18) va sostituito col dominio definitivo.
  site: 'https://cycling-in-tuscany-astro.pages.dev',
  integrations: [sitemap()],
});
