// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Dominio definitivo del go-live (#18). Alimenta il sitemap e i canonical/og:url
  // di src/layouts/Base.astro, quindi va scritto qui l'host che *serve* le pagine.
  //
  // Non è cyclingintuscany.com: quello è un redirect verso questo terzo livello.
  // Metterci il dominio che rimanda vorrebbe dire dichiarare come pagina ufficiale un
  // URL che non serve niente. Stesso valore anche in public/robots.txt.
  //
  // Dal 27/8/2026 è `365`, non più `cyclingintuscany`: il sito è la costola che tiene
  // vivo il Tuscany Trail negli undici mesi fuori evento, e il nome lo dice. Anche il
  // vecchio terzo livello ora rimanda qui con un 301, quindi non va rimesso in giro.
  site: 'https://365.tuscanytrail.it',
  integrations: [sitemap()],
});
