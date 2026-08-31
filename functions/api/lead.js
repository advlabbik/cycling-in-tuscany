/**
 * Gate email degli itinerari — Cloudflare Pages Function.
 *
 * Dal 27/8/2026 (decisione di Andrea) IL FILE VIAGGIA NELL'EMAIL: niente piu'
 * download in pagina. Il form manda { email, consent, itinerary, gpx, lang,
 * area, type, diff }; qui si fa, in ordine:
 *   1. iscrizione del contatto su Brevo con gli attributi di provenienza (il
 *      tagging degli intenti del doc TT365). IL CONSENSO E' OBBLIGATORIO
 *      (Andrea, 27/8): senza spunta non parte niente e si risponde errore.
 *      Lo scambio e' dichiarato in pagina — il GPX in cambio dell'iscrizione —
 *      e la spunta resta vuota di default, mai pre-selezionata;
 *   2. email transazionale da 365@tuscanytrail.it col LINK DI DOWNLOAD del
 *      GPX. Testo di Andrea, UGUALE PER TUTTI — cambia solo il link, quindi in
 *      gpxEmailHtml() non entrano ne' il nome del percorso ne' la sua zona.
 *      NIENTE Ride with GPS: su TT365 non e' sponsor (Andrea, 27/8), quindi
 *      non si cita ne' in pagina ne' nell'email.
 *      NB: l'allegato .gpx e' stato provato il 27/8 e Brevo lo RIFIUTA — gli
 *      attachment (url o content) accettano solo una whitelist di estensioni
 *      e .gpx non c'e'; rinominarlo .xml romperebbe l'import sui ciclocomputer.
 *      Quindi il file viaggia come link, che era l'alternativa gia' approvata.
 * Se una delle due chiamate fallisce si risponde errore: il form lo dice e
 * l'utente riprova — mai perdere un lead o una consegna in silenzio.
 *
 * La chiave vive nelle env var del progetto Cloudflare Pages (Settings →
 * Environment variables → BREVO_API_KEY, BREVO_LIST_ID), mai nella repo.
 * Sulle preview non c'e': risposta { ok, demo } senza chiamare Brevo.
 * NB: gli attributi CIT_* vanno creati una volta in Brevo (Contacts →
 * Settings → Contact attributes), altrimenti Brevo rifiuta la richiesta.
 */

import { signGpxToken } from '../../lib/gpx-token.js';

/* Stessa coppia di service-request.js: mittente sul dominio radice (sender
   Brevo id 10, creato e gia' attivo il 27/8/2026 — il dominio e' autenticato,
   quindi non c'e' stata nessuna email di validazione da cliccare), reply-to
   sulla casella presidiata — se uno risponde all'email del GPX deve leggerlo
   una persona, non un'identita' di spedizione.

   ⚠️ NON mettere 365@ nel reply-to, per quanto sia tentante avere un
   indirizzo solo: 365@ inoltra a **info@tuscanytrail.it**, NON a collab@
   (verificato il 27/8/2026). Le risposte dei clienti finirebbero in una
   casella diversa da quella dove le richieste vengono lavorate, mentre la
   notifica interna continua ad arrivare in collab@: richiesta di qua,
   risposta di la'. Se un giorno viene aggiunto l'inoltro 365@ -> collab@,
   allora si', e da qui esce anche il mailto: dell'unsubscribe. */
const SENDER = { name: 'Tuscany Trail 365', email: '365@tuscanytrail.it' };
const REPLY_TO = 'collab@tuscanytrail.it';

/* Quanto vive il link del download. Il vincolo e' l'inbox: uno riapre l'email
   mesi dopo e il link deve ancora funzionare. 90 giorni copre il caso reale
   senza lasciare in giro link eterni; scaduto, /api/gpx rimanda al form. */
const GIORNI_VALIDITA = 90;

/**
 * Costruisce il link di download firmato.
 *
 * Se GPX_LINK_SECRET manca (tipicamente sulle preview, dove non ci sono i
 * secret) si ripiega sul file pubblico invece di spedire un link morto: l'utente
 * ha chiesto il suo percorso e lo deve ricevere. Il log dice che la
 * configurazione e' incompleta — meglio un file non protetto che una promessa
 * non mantenuta, ma va visto e sistemato.
 */
async function linkDownload(origin, gpxPath, routePage, secret) {
  if (!secret) {
    console.error('[lead] GPX_LINK_SECRET assente: link pubblico invece che firmato');
    return origin + gpxPath;
  }
  const file = gpxPath.replace('/gpx/', '');
  const slug = (routePage.match(/\/itinerari\/([a-z0-9-]+)\/?$/) || [])[1] || '';
  const scadenza = Math.floor(Date.now() / 1000) + GIORNI_VALIDITA * 86400;
  const token = await signGpxToken(slug, scadenza, secret, file);
  return `${origin}/api/gpx?t=${token}`;
}

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: 'invalid json' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ ok: false, error: 'invalid body' }, 400);
  // honeypot: campo invisibile agli umani; se e' pieno si risponde ok e si butta
  if (body.website) return json({ ok: true });
  const email = String(body.email || '').trim();
  if (!email.includes('@')) return json({ ok: false, error: 'invalid email' }, 400);

  /* Senza consenso non si fa NIENTE — ne' contatto ne' file. Il controllo sta
     anche qui e non solo nel `required` del form, perche' l'HTML si aggira in
     tre secondi con la console aperta. */
  const consent = Boolean(body.consent);
  if (!consent) return json({ ok: false, error: 'consent required' }, 400);

  /* Il path del GPX arriva dal client ma NON ci si fida: si accetta solo un
     file dentro /gpx/ del NOSTRO host, ricostruito qui. Senza questo controllo
     chiunque potrebbe farci spedire allegati arbitrari a nome nostro. */
  const gpxPath = String(body.gpx || '');
  if (!/^\/gpx\/[A-Za-z0-9._-]+\.gpx$/.test(gpxPath)) {
    return json({ ok: false, error: 'invalid gpx' }, 400);
  }
  const origin = new URL(context.request.url).origin;

  const routePage = /^\/itinerari\/[A-Za-z0-9._/-]*$/.test(String(body.itinerary || ''))
    ? origin + String(body.itinerary)
    : origin + '/itinerari/';

  const key = context.env.BREVO_API_KEY;
  if (!key) return json({ ok: true, demo: true });

  // 1) contatto su Brevo — se fallisce ci si ferma: il lead E' il valore
  const listId = Number(context.env.BREVO_LIST_ID);
  const payload = {
    email,
    updateEnabled: true,
    // il consenso e' gia' obbligatorio piu' sopra: qui resta solo il controllo
    // che BREVO_LIST_ID sia un numero valido
    ...(Number.isFinite(listId) && listId > 0 ? { listIds: [listId] } : {}),
    attributes: {
      CIT_ITINERARY: String(body.itinerary || ''),
      CIT_CONSENT: consent,
      CIT_LANG: String(body.lang || 'en'),
      CIT_AREA: String(body.area || ''),
      CIT_TYPE: String(body.type || ''),
      CIT_DIFF: String(body.diff || ''),
    },
  };
  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    // 201 creato, 204 aggiornato: entrambi successo per Brevo
    if (res.status !== 201 && res.status !== 204) {
      console.error('[lead] Brevo ha risposto', res.status, await res.text());
      return json({ ok: false, error: 'brevo ' + res.status });
    }
  } catch (err) {
    console.error('[lead] Brevo non raggiungibile', err);
    return json({ ok: false, error: 'brevo unreachable' });
  }

  /* Il link di download e' firmato e a scadenza, e punta a /api/gpx: quello che
     esce di li' e' la traccia PIU' i waypoint (fontane, ristori, officine,
     alloggi, paesi). Il file pubblico in /gpx/ resta la traccia nuda e serve a
     Stay22, che se lo scarica dai suoi server per disegnare il percorso sotto
     gli alloggi: chiuderlo romperebbe la mappa da cui arrivano 37 prenotazioni
     su 38. Chi passa dal form non ottiene un permesso in piu', ottiene un file
     migliore. */
  const gpxUrl = await linkDownload(origin, gpxPath, routePage, context.env.GPX_LINK_SECRET);

  // 2) email col link di download — se fallisce il form lo dice, niente promesse a vuoto
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email }],
        replyTo: { email: REPLY_TO },
        /* L'email e' promozionale oltre che di servizio (racconta il progetto e
           propone noleggio e tour), quindi l'uscita dalla lista deve esserci:
           Brevo mette l'unsubscribe da solo nelle CAMPAGNE, non nelle
           transazionali. Header + riga in fondo, e la privacy policy promette
           esattamente questo. */
        headers: { 'List-Unsubscribe': `<mailto:${REPLY_TO}?subject=unsubscribe>` },
        subject: 'Your route is ready, and it took us 20 years',
        htmlContent: gpxEmailHtml({ gpxUrl, routePage, servicesUrl: origin + '/services/', unsubscribeTo: REPLY_TO }),
      }),
    });
    if (res.status !== 201 && res.status !== 202) {
      console.error('[lead] invio GPX fallito', res.status, await res.text());
      return json({ ok: false, error: 'send failed' });
    }
  } catch (err) {
    console.error('[lead] invio GPX fallito', err);
    return json({ ok: false, error: 'send failed' });
  }

  return json({ ok: true });
}

/**
 * L'email di consegna, testo di Andrea (27/8/2026). E' UGUALE PER TUTTI: cambia
 * solo il link del file, come da sua indicazione. Quindi niente nome del
 * percorso e niente nome della zona nel corpo — l'unica cosa che varia sarebbe
 * il link, e un testo unico che nomina una zona sola sarebbe falso per i
 * percorsi delle altre (i quattro di Punta Ala stanno in Maremma, non sulla
 * Costa degli Etruschi). Per questo il paragrafo sul territorio nomina le tre
 * macro-aree che il progetto copre davvero.
 * I richiami sono LINK TESTUALI e non bottoni, sempre per scelta di Andrea.
 */
function gpxEmailHtml({ gpxUrl, routePage, servicesUrl, unsubscribeTo }) {
  const a = (href, text) => `<a href="${href}" style="color:#a80030;font-weight:600">${text}</a>`;
  const h = (text) => `<p style="font-size:17px;font-weight:700;color:#1a0e12;margin:34px 0 10px">${text}</p>`;
  const p = (text) => `<p style="margin:0 0 16px">${text}</p>`;
  return (
    `<div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#222;max-width:560px;margin:0 auto;padding:8px">` +
    // preheader: si legge nell'anteprima della inbox, non nel corpo
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0">Where this route comes from, what we can do for you down here, and the file waiting for you at the end</div>` +
    p('We are glad you want to explore a piece of Tuscany by bike. We have been riding this land for 20 years and we still are not tired of it.') +
    p('Before we hand you the file, let us tell you where this route comes from, because it is not a line someone drew on a map.') +
    h('The route you are about to download was born from the Tuscany Trail') +
    p('The Tuscany Trail is the biggest bikepacking event in the world. Every year more than 6,000 riders from 70 countries land in Tuscany and cross it with everything they need loaded on the bike. We created it and we have been building it ever since.') +
    p('Everything you find on Tuscany Trail 365 comes out of that work. Twenty years of scouting, roads ridden one by one, gravel checked season after season, climbs measured, water points and food stops written down. Nothing here is copied from somewhere else and nothing is guessed. If a road is in our track it means we rode it, and it means we decided it was worth your time.') +
    h('Why we picked this corner of Tuscany') +
    p('The land you are heading into runs from the Etruscan Coast through the Metalliferous Hills and down into the Maremma, around Campiglia Marittima, where the Tuscany Trail starts and finishes.') +
    p('Medieval villages sitting on top of the hills, thermal springs where the water comes out warm from the ground, old mining trails that nobody uses any more, white gravel roads running through the woods, and then the sea opening up in front of you when you least expect it.') +
    p('We selected this area because it truly deserves to be seen by bike, and because the bike is the only way to see it properly. In a car you cross it in forty minutes and you remember nothing. On a bike it takes you days, and it gives you everything.') +
    h('Why we built 365') +
    p('The Tuscany Trail happens once a year. Tuscany is here every single day.') +
    p('With the 365 project we wanted to give continuity to our work of promoting this region, because it comes straight from the heart and because we love our land. Sixteen verified loops, gravel and road, ready whenever you are.') +
    h('Two things we can do for you before you go') +
    p('If you do not have a bike with you, we can find you one. Gravel, road, mountain bike or electric. You send us the request and we check real availability with our official partners and the local shops we trust. A person reads it and answers you within two working days.') +
    p('And if you want more than one loop, we can build you a tour. No catalogue, no fixed packages. You tell us the style you like, how many days you have and how many you are, and we draw the trip on you. Routes designed by the people who created the Tuscany Trail, logistics handled by people who actually live here.') +
    p(a(servicesUrl, 'Ask us for a bike or a tour &rarr;')) +
    h('One thing about where you sleep') +
    p(`The stays you find on 365 are not there by chance. They are the places where we go to relax too, they keep your bike safe overnight, they let you wash it and they serve breakfast early when you need to leave early. Trust us, we did not pick them at random. ${a(routePage, 'They are all on the map of your route page')}.`) +
    h('And here is your route') +
    p(`<span style="font-size:18px">${a(gpxUrl, 'Download your GPX file &darr;')}</span>`) +
    p(`<span style="color:#666;font-size:13px">If the link does not open, copy this address — ${gpxUrl}</span>`) +
    p('Load it on your bike computer, take the time you need and enjoy every kilometre of it.') +
    p('If you have a question just answer this email. A person reads it and a person answers you.') +
    p('See you in Tuscany<br>Tuscany Trail Team') +
    p(`<span style="color:#666;font-size:14px">PS. The one you just picked is one of sixteen loops we verified down here, and some of them we like even more. If you want a bike waiting for you or a tour built around your days, ${a(servicesUrl, 'the request takes two minutes')} and there is nothing to pay to ask.</span>`) +
    `<hr style="border:0;border-top:1px solid #e5e0d8;margin:30px 0 14px">` +
    `<p style="color:#888;font-size:12px;line-height:1.5;font-family:sans-serif;margin:0">` +
    `You are getting this email because you asked us for a GPX file on Tuscany Trail 365. ` +
    `If you would rather not hear from us again, ${a(`mailto:${unsubscribeTo}?subject=unsubscribe`, 'tell us here')} and we take you off the list — the file you just got stays yours.<br>` +
    `AdventureLab S.r.l. · Via Giulio Braga 98, 59100 Prato (PO), Italy` +
    `</p>` +
    `</div>`
  );
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
