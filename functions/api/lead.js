/**
 * Gate email degli itinerari — Cloudflare Pages Function.
 *
 * Dal 27/8/2026 (decisione di Andrea) IL FILE VIAGGIA NELL'EMAIL: niente piu'
 * download in pagina. Il form manda { email, consent, itinerary, name, gpx,
 * lang, area, type, diff }; qui si fa, in ordine:
 *   1. iscrizione del contatto su Brevo con gli attributi di provenienza (il
 *      tagging degli intenti del doc TT365). IL CONSENSO E' OBBLIGATORIO
 *      (Andrea, 27/8): senza spunta non parte niente e si risponde errore.
 *      Lo scambio e' dichiarato in pagina — il GPX in cambio dell'iscrizione —
 *      e la spunta resta vuota di default, mai pre-selezionata;
 *   2. email transazionale da hello@tuscanytrail.it col LINK DI DOWNLOAD del
 *      GPX in evidenza. NIENTE Ride with GPS: su TT365 non e' sponsor
 *      (Andrea, 27/8), quindi non si cita ne' in pagina ne' nell'email.
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

/* Stessa coppia di service-request.js: mittente sul dominio radice (sender
   Brevo validato, id 9), reply-to sulla casella presidiata — se uno risponde
   all'email del GPX deve leggerlo una persona, non un'identita' di spedizione. */
const SENDER = { name: 'Tuscany Trail 365', email: 'hello@tuscanytrail.it' };
const REPLY_TO = 'collab@tuscanytrail.it';

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
  const gpxUrl = origin + gpxPath;

  const routeName = clip(body.name, 80) || 'your route';
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

  // 2) email col link di download — se fallisce il form lo dice, niente promesse a vuoto
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email }],
        replyTo: { email: REPLY_TO },
        subject: `Your GPX — ${routeName}`,
        htmlContent:
          `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:560px">` +
          `<p>Thanks for riding with us — here's the GPX of <b>${esc(routeName)}</b>, ready to load on your bike computer.</p>` +
          `<p style="margin:24px 0"><a href="${gpxUrl}" style="background:#f5a623;color:#1a0e12;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:999px;display:inline-block">Download the GPX &darr;</a></p>` +
          `<p style="color:#666;font-size:13px">Button not working? Copy this link — ${gpxUrl}</p>` +
          `<p>Planning where to sleep along the loop? Every stay on the map of <a href="${routePage}">the route page</a> is bookable.</p>` +
          `<p>Ride on,<br>The Tuscany Trail 365 team</p>` +
          `</div>`,
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

function clip(v, max) {
  return String(v ?? '').trim().slice(0, max);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
