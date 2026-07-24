// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://cycling-in-tuscany.pages.dev',
  integrations: [sitemap()],
});
