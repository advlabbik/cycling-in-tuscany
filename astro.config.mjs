// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Dominio definitivo del go-live (#18). Alimenta il sitemap e i canonical/og:url
  // di src/layouts/Base.astro, quindi va scritto qui l'host che *serve* le pagine.
  //
  // Non è cyclingintuscany.com: quello diventa un redirect verso questo terzo livello.
  // Metterci il dominio che rimanda vorrebbe dire dichiarare come pagina ufficiale un
  // URL che non serve niente. Stesso valore anche in public/robots.txt.
  site: 'https://cyclingintuscany.tuscanytrail.it',
  integrations: [sitemap()],
});
