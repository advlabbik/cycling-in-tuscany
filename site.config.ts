export const site = {
  stay22Aid: '694570b3581ec595fca56708',
  stay22Campaign: 'tuscanytrail',
  /**
   * GA4 Measurement ID (formato G-XXXXXXXXXX). Stringa vuota = analitica
   * completamente spenta: niente gtag, niente banner consenso (issue #19).
   * Si valorizza quando la proprietà GA4 del sito viene creata.
   */
  ga4MeasurementId: '',
  brand: {
    email: 'hello@cyclingintuscany.com',
    instagram: '@cyclingintuscany_official',
  },
  map: { center: [10.68, 42.98], zoom: 9 },
  /** ordine delle strutture nella home — era STR_ORDER in _prototipo/build_pages.py */
  struttureOrder: ['punta-ala', 'villaggio-orizzonte', 'villa-toscana'],
};
