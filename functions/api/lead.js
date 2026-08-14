/**
 * Gate email degli itinerari — Cloudflare Pages Function.
 *
 * Riceve { email, consent, itinerary, lang } dal form GPX e iscrive il contatto
 * su Brevo con gli attributi di provenienza, così il nurture sa da quale
 * itinerario arriva il lead. La chiave vive nelle env var del progetto
 * Cloudflare Pages (Settings → Environment variables → BREVO_API_KEY,
 * BREVO_LIST_ID), mai nella repo.
 *
 * Senza chiave configurata risponde comunque ok: il prototipo deve mostrare il
 * flusso anche prima che Brevo sia collegato.
 */
export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: 'invalid json' }, 400);
  }
  const email = String(body.email || '').trim();
  if (!email.includes('@')) return json({ ok: false, error: 'invalid email' }, 400);

  const key = context.env.BREVO_API_KEY;
  if (!key) return json({ ok: true, demo: true });

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      updateEnabled: true,
      listIds: context.env.BREVO_LIST_ID ? [Number(context.env.BREVO_LIST_ID)] : undefined,
      attributes: {
        CIT_ITINERARY: String(body.itinerary || ''),
        CIT_CONSENT: Boolean(body.consent),
        CIT_LANG: String(body.lang || 'en'),
      },
    }),
  });
  // 201 creato, 204 aggiornato: entrambi sono un successo per Brevo
  return json({ ok: res.status === 201 || res.status === 204 });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
