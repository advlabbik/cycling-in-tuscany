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
  /**
   * L'indirizzo pubblico del sito — footer, privacy policy, cookie policy,
   * affiliate disclosure, e il contatto per le richieste GDPR.
   *
   * Dal 27/8/2026 e' `hello@tuscanytrail.it` e non piu' `hello@cyclingintuscany.com`:
   * deve essere lo STESSO indirizzo da cui parte la posta (mittente della lista
   * Brevo 29, vedi README), altrimenti chi riceve la newsletter legge sul sito
   * un recapito diverso da quello che gli ha scritto — e per il GDPR quello e'
   * il canale con cui esercita i suoi diritti.
   *
   * L'handle Instagram resta `@cyclingintuscany_official`: e' un account vero,
   * non un recapito, e rinominarlo e' un'altra decisione.
   */
  brand: {
    email: 'hello@tuscanytrail.it',
    instagram: '@cyclingintuscany_official',
  },
  /**
   * Date di ripiego della mappa prenotazioni, per quando il link non ne porta.
   * La mappa non deve mai aprirsi con le caselle vuote: senza date Stay22 non
   * mostra né prezzi né disponibilità. Regola decisa con Andrea (18/8): si mette
   * la notte prima della PRIMA partenza, chi arriva per altre date se la cambia.
   * La mail di conferma iscrizione può sovrascriverle per singolo partecipante
   * passando ?checkin=&checkout= (vedi Stay22MapSection.astro).
   * ⚠️ DA CONFERMARE sul calendario TT27 ufficiale: qui c'è il 18 maggio 2027,
   * ipotizzando partenze 19-20-21 (nel 2026 furono 20-21-22 maggio).
   */
  defaultStayDates: { checkin: '2027-05-18', checkout: '2027-05-19' },
  map: { center: [10.68, 42.98], zoom: 9 },
  /** ordine delle strutture nella home — era STR_ORDER in _prototipo/build_pages.py */
  struttureOrder: ['punta-ala', 'villaggio-orizzonte', 'villa-toscana'],
};
