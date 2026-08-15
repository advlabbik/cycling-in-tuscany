import { site } from '../../site.config';

/**
 * UNICA fonte degli URL Stay22. L'AID arriva sempre da site.config.ts
 * (`adventurelabsrl`, l'account agganciato alle commissioni al 30%): prima era
 * ricostruito in 4 punti diversi e un cambio di AID rischiava di lasciare
 * pagine che accreditano l'account sbagliato senza nessun errore.
 */
export const stay22RoamUrl = (lat: number, lng: number, campaign: string = site.stay22Campaign) =>
  `https://www.stay22.com/allez/roam?aid=${site.stay22Aid}&campaign=${encodeURIComponent(campaign)}` +
  `&lat=${lat}&lng=${lng}&product_medium=apps`;

/** mappa embeddata, stesso contratto della guida Trentino (tg-guida) */
export const stay22EmbedUrl = (lat: number, lng: number, campaign: string, venue: string) =>
  `https://www.stay22.com/embed/gm?aid=${site.stay22Aid}&campaign=${encodeURIComponent(campaign)}` +
  `&lat=${lat}&lng=${lng}&maincolor=C74634&venue=${encodeURIComponent(venue)}&ljs=en&mapstyle=outdoors`;
