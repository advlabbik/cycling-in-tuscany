// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Dominio definitivo del go-live (#18). Alimenta il sitemap e i canonical/og:url
  // di src/layouts/Base.astro, quindi va scritto qui l'host che vogliamo indicizzato,
  // non quello da cui il sito è servito in questo momento.
  //
  // Apex, non www: oggi cyclingintuscany.com e www.cyclingintuscany.com rispondono
  // entrambi 200 senza redirect fra loro. Il canonical apex fa convergere le due
  // varianti su una sola, ma la regola di redirect www → apex va comunque messa in
  // Cloudflare al cutover, altrimenti restano due URL serviti per ogni pagina.
  site: 'https://cyclingintuscany.com',
  integrations: [sitemap()],
});
