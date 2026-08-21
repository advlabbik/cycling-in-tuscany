/**
 * Richieste noleggio bici / tour su misura — Cloudflare Pages Function.
 *
 * Gemella di lead.js ma con un lavoro in piu': oltre a taggare il contatto
 * su Brevo, spedisce DUE email transazionali (API smtp/email di Brevo):
 *   1. la notifica interna a chi risponde alle richieste (SERVICE_NOTIFY_EMAIL,
 *      default collab@) con reply-to = il richiedente, cosi' si risponde
 *      direttamente dal client di posta;
 *   2. la conferma automatica al richiedente ("stiamo verificando coi partner,
 *      ti rispondiamo entro due giorni lavorativi").
 * La SECONDA risposta (disponibilita' trovata / non trovata) e' sempre MANUALE:
 * i template stanno in docs/servizi-noleggio-tour.md. Prima si sentono davvero
 * i partner, poi si risponde — mai un no automatico.
 *
 * Questo e' il test di domanda del doc TT365 (esca): misurare quante richieste
 * arrivano PRIMA di cercare il partner che eroga il servizio. La notifica
 * interna e' il canale primario; il tagging Brevo e' best-effort e non blocca.
 *
 * Env su Cloudflare Pages: BREVO_API_KEY (gia' presente per lead.js),
 * SERVICE_NOTIFY_EMAIL (opzionale, default collab@tuscanytrail.it).
 * Il mittente hello@tuscanytrail.it deve esistere come casella ed essere
 * validato in Brevo (Senders & domains); tuscanytrail.it e' gia' tra i domini
 * mittente aziendali, quindi la firma del dominio e' a posto.
 * NB: gli attributi CIT_SERVICE e CIT_SERVICE_INFO vanno creati una volta in
 * Brevo (Contacts → Settings → Contact attributes), come i CIT_* di lead.js.
 */

/* Mittente delle due email. Sta su tuscanytrail.it, il dominio su cui il sito
   vive davvero (cyclingintuscany.tuscanytrail.it) e gia' autorizzato a
   spedire. NON e' collab@ di proposito: da quella casella non deve partire
   posta automatica verso i clienti (Andrea, 21/8). */
const SENDER = { name: 'Tuscany Trail 365', email: 'hello@tuscanytrail.it' };
/* Dove atterra il lavoro da fare. collab@ e' la casella condivisa Andrea +
   Francesca, cioe' chi poi telefona ai partner per cercare disponibilita', e
   le sue email rimbalzano anche in Slack su #email-collab: le richieste si
   vedono senza aprire la posta. */
const NOTIFY_FALLBACK = 'collab@tuscanytrail.it';
/* I link dentro le email puntano all'host che serve davvero le pagine, non al
   vecchio cyclingintuscany.com che oggi e' soltanto un redirect. */
const SITE = 'https://cyclingintuscany.tuscanytrail.it';

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
  const service = body.service === 'tour' ? 'tour' : 'rental';
  const name = clip(body.name, 80) || 'rider';
  const consent = Boolean(body.consent);

  // i campi variano tra i due form; si tengono solo quelli attesi, accorciati
  const fields =
    service === 'rental'
      ? [
          ['Dates', clip(body.from, 20) + ' → ' + clip(body.to, 20)],
          ['Pickup area', clip(body.area, 120)],
          ['Bike type', clip(body.bike, 40)],
          ['Riders', clip(body.riders, 10)],
          ['Notes', clip(body.notes, 1000)],
        ]
      : [
          ['Period', clip(body.period, 120)],
          ['Days', clip(body.days, 10)],
          ['Group size', clip(body.group, 10)],
          ['Ride style', clip(body.style, 40)],
          ['The trip in mind', clip(body.notes, 2000)],
        ];

  const key = context.env.BREVO_API_KEY;
  if (!key) return json({ ok: true, demo: true });
  const notifyTo = String(context.env.SERVICE_NOTIFY_EMAIL || NOTIFY_FALLBACK);

  const label = service === 'rental' ? 'Bike rental' : 'Custom tour';
  const rows = [['Name', name], ['Email', email], ...fields, ['Newsletter consent', consent ? 'yes' : 'no']]
    .filter(([, v]) => v && v !== ' → ')
    .map(([k, v]) => `<tr><td style="padding:4px 14px 4px 0;color:#888">${esc(k)}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`)
    .join('');

  // 1) notifica interna — se questa fallisce la richiesta NON risulta inviata:
  //    meglio un errore visibile al form che una richiesta persa in silenzio
  const internal = await sendEmail(key, {
    sender: SENDER,
    to: [{ email: notifyTo }],
    replyTo: { email, name },
    subject: `[TT365] ${label} request — ${name}`,
    htmlContent:
      `<p>Nuova richiesta <b>${esc(label)}</b> dal sito (rispondere entro 2 giorni lavorativi, ` +
      `prima sentire i partner — template in docs/servizi-noleggio-tour.md).</p>` +
      `<table style="font-size:14px;font-family:sans-serif">${rows}</table>` +
      `<p style="color:#888;font-size:12px">Rispondi a questa email per scrivere direttamente al richiedente.</p>`,
  });
  if (!internal.ok) {
    console.error('[service-request] notifica interna fallita', internal.status, internal.text);
    return json({ ok: false, error: 'notify failed' });
  }

  // 2) conferma automatica al richiedente — best-effort, la richiesta e' gia' da noi
  const ack = ackEmail(service, name, fields);
  /* Se il richiedente risponde alla conferma, la risposta deve atterrare dove
     sta gia' la richiesta — la casella presidiata — e non su hello@, che puo'
     benissimo essere un'identita' di sola spedizione. */
  const auto = await sendEmail(key, {
    sender: SENDER,
    to: [{ email, name }],
    replyTo: { email: notifyTo },
    subject: ack.subject,
    htmlContent: ack.html,
  });
  if (!auto.ok) console.error('[service-request] autoreply fallita', auto.status, auto.text);

  // 3) tagging Brevo del contatto — best-effort, come lead.js
  try {
    const listId = Number(context.env.BREVO_LIST_ID);
    const info = fields.map(([k, v]) => (v ? `${k}=${v}` : '')).filter(Boolean).join(' | ');
    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        updateEnabled: true,
        ...(consent && Number.isFinite(listId) && listId > 0 ? { listIds: [listId] } : {}),
        attributes: { CIT_SERVICE: service, CIT_SERVICE_INFO: info.slice(0, 500), CIT_CONSENT: consent },
      }),
    });
  } catch (err) {
    console.error('[service-request] tagging contatto fallito', err);
  }

  return json({ ok: true });
}

function ackEmail(service, name, fields) {
  const recap = fields
    .filter(([, v]) => v && v !== ' → ')
    .map(([k, v]) => `<li>${esc(k)} — ${esc(v)}</li>`)
    .join('');
  const what = service === 'rental' ? 'bike rental request' : 'custom tour request';
  return {
    subject: `We've received your ${what}`,
    html:
      `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:560px">` +
      `<p>Hi ${esc(name)},</p>` +
      `<p>Thanks for writing — your ${what} is with us.</p>` +
      (recap ? `<p>Here's what you asked for.</p><ul>${recap}</ul>` : '') +
      `<p>We're now checking availability with our partner network in the area. ` +
      `A real person will get back to you within two working days, with an option or an honest answer.</p>` +
      `<p>In the meantime, our verified routes are free to browse and download on ` +
      `<a href="${SITE}/itinerari/">Tuscany Trail 365</a>.</p>` +
      `<p>Ride on,<br>The Tuscany Trail 365 team</p>` +
      `</div>`,
  };
}

async function sendEmail(key, payload) {
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 201 || res.status === 202) return { ok: true };
    return { ok: false, status: res.status, text: await res.text() };
  } catch (err) {
    return { ok: false, status: 0, text: String(err) };
  }
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
