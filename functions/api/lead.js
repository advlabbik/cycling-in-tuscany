/**
 * Gate email degli itinerari — Cloudflare Pages Function.
 *
 * Riceve { email, consent, itinerary, lang, area, type, diff } dal form GPX e
 * iscrive il contatto su Brevo con gli attributi di provenienza (il tagging
 * degli intenti del doc TT365: zona/tipo/difficolta' per ogni download).
 * La chiave vive nelle env var del progetto Cloudflare Pages (Settings →
 * Environment variables → BREVO_API_KEY, BREVO_LIST_ID), mai nella repo.
 * NB: gli attributi CIT_* vanno creati una volta in Brevo (Contacts →
 * Settings → Contact attributes), altrimenti Brevo rifiuta la richiesta.
 *
 * Il contatto entra nella lista SOLO con consenso: chi toglie la spunta
 * scarica il GPX ma non finisce nel nurture.
 * Senza chiave configurata risponde comunque ok (demo); qualsiasi errore
 * degrada in una risposta JSON, mai in un 500.
 */
export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: 'invalid json' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ ok: false, error: 'invalid body' }, 400);
  const email = String(body.email || '').trim();
  if (!email.includes('@')) return json({ ok: false, error: 'invalid email' }, 400);

  const key = context.env.BREVO_API_KEY;
  if (!key) return json({ ok: true, demo: true });

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
    if (res.status === 201 || res.status === 204) return json({ ok: true });
    console.error('[lead] Brevo ha risposto', res.status, await res.text());
    return json({ ok: false, error: 'brevo ' + res.status });
  } catch (err) {
    console.error('[lead] Brevo non raggiungibile', err);
    return json({ ok: false, error: 'brevo unreachable' });
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
