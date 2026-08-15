export const site = {
  /**
   * AID unificato su `adventurelabsrl` (15/8, richiesta Andrea): è l'account
   * della guida Trentino, quello agganciato alle commissioni al 30% —
   * "il codice del Trentino sennò non arrivano le commissioni". Il vecchio
   * `694570b3581ec595fca56708` restava solo qui ed era da verificare.
   */
  stay22Aid: 'adventurelabsrl',
  stay22Campaign: 'cit-sito',
  /**
   * GA4 Measurement ID (formato G-XXXXXXXXXX). Stringa vuota = analitica
   * completamente spenta: niente gtag, niente banner consenso (issue #19).
   * Si valorizza quando la proprietà GA4 del sito viene creata.
   */
  ga4MeasurementId: 'G-FELFB9W37W',
  brand: {
    email: 'hello@cyclingintuscany.com',
    instagram: '@cyclingintuscany_official',
  },
  map: { center: [10.68, 42.98], zoom: 9 },
  /** ordine delle strutture nella home — era STR_ORDER in _prototipo/build_pages.py */
  struttureOrder: ['punta-ala', 'villaggio-orizzonte', 'villa-toscana'],
};
