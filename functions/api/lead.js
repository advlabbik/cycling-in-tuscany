/**
 * Gate email degli itinerari — Cloudflare Pages Function.
 *
 * Dal 28/8/2026 (decisione di Andrea) IL FILE VIAGGIA NELL'EMAIL: niente piu'
 * download in pagina. Il form manda { email, consent, itinerary, name, gpx,
 * rwgps, lang, area, type, diff }; qui si fa, in ordine:
 *   1. iscrizione/aggiornamento del contatto su Brevo con gli attributi di
 *      provenienza (il tagging degli intenti del doc TT365) — in lista SOLO
 *      col consenso, chi non spunta riceve il GPX ma resta fuori dal nurture;
 *   2. email transazionale da hello@tuscanytrail.it col GPX IN ALLEGATO,
 *      piu' un link di riserva al file e il link Ride with GPS (lo sponsor
 *      resta visibile, ma DENTRO l'email — il gate non si aggira).
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

  /* Il path del GPX arriva dal client ma NON ci si fida: si accetta solo un
     file dentro /gpx/ del NOSTRO host, ricostruito qui. Senza questo controllo
     chiunque potrebbe farci spedire allegati arbitrari a nome nostro. */
  const gpxPath = String(body.gpx || '');
  if (!/^\/gpx\/[A-Za-z0-9._-]+\.gpx$/.test(gpxPath)) {
    return json({ ok: false, error: 'invalid gpx' }, 400);
  }
  const origin = new URL(context.request.url).origin;
  const gpxUrl = origin + gpxPath;
  const gpxFile = gpxPath.slice(gpxPath.lastIndexOf('/') + 1);

  const routeName = clip(body.name, 80) || 'your route';
  const routePage = /^\/itinerari\/[A-Za-z0-9._/-]*$/.test(String(body.itinerary || ''))
    ? origin + String(body.itinerary)
    : origin + '/itinerari/';
  const rwgps = /^https:\/\/ridewithgps\.com\//.test(String(body.rwgps || '')) ? String(body.rwgps) : '';

  const key = context.env.BREVO_API_KEY;
  if (!key) return json({ ok: true, demo: true });

  // 1) contatto su Brevo — se fallisce ci si ferma: il lead E' il valore
  const consent = Boolean(body.consent);
  const listId = Number(context.env.BREVO_LIST_ID);
  const payload = {
    email,
    updateEnabled: true,
    // in lista solo col consenso, e solo se BREVO_LIST_ID e' un numero valido
    ...(consent && Number.isFinite(listId) && listId > 0 ? { listIds: [listId] } : {}),
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

  // 2) email col GPX allegato — se fallisce il form lo dice, niente promesse a vuoto
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email }],
        replyTo: { email: REPLY_TO },
        subject: `Your GPX — ${routeName}`,
        attachment: [{ url: gpxUrl, name: gpxFile }],
        htmlContent:
          `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:560px">` +
          `<p>Thanks for riding with us — attached is the GPX of <b>${esc(routeName)}</b>, ready to load on your bike computer.</p>` +
          `<p>If the attachment doesn't show up, <a href="${gpxUrl}">download the file from here</a>.</p>` +
          (rwgps ? `<p>Prefer riding with the Ride with GPS app? <a href="${esc(rwgps)}">Open this route on Ride with GPS</a>.</p>` : '') +
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
