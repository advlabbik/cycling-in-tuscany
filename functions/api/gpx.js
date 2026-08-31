/**
 * Consegna del GPX arricchito — Cloudflare Pages Function.
 *
 * Dal 31/8/2026 il file che arriva dal form NON e' piu' lo stesso che chiunque
 * scarica da /gpx/: quello resta la traccia nuda, e serve a Stay22, che se lo
 * va a prendere dai suoi server per disegnare il percorso sotto gli alloggi
 * (src/lib/stay22.ts). Chiudere /gpx/ romperebbe la mappa alloggi, cioe' 37
 * prenotazioni su 38.
 *
 * Quello che esce di qui e' la stessa traccia PIU' i waypoint costruiti dai POI
 * dell'itinerario: fontane, ristori, officine, alloggi, paesi, ognuno col km a
 * cui cade. Il valore non e' tolto all'URL pubblico, e' aggiunto a questo.
 *
 * ⚠️ Il token e' un DETERRENTE, non una serratura: senza login chi riceve
 * l'email puo' girare il link a un amico e quello scarica. Ferma lo scraping e
 * l'accesso senza form, non la condivisione tra persone.
 *
 * Il secret vive nelle env var del progetto Cloudflare Pages
 * (Settings → Environment variables → GPX_LINK_SECRET), mai nella repo.
 */

import { verifyGpxToken } from '../../lib/gpx-token.js';
import { buildEnrichedGpx } from '../../lib/gpx-enrich.js';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const token = url.searchParams.get('t') || '';

  const secret = context.env.GPX_LINK_SECRET;
  // Sulle preview il secret non c'e', esattamente come le chiavi Brevo: meglio
  // dirlo che rispondere 403 e far cercare un bug che non esiste.
  if (!secret) return pagina(503, 'Download non configurato su questo ambiente.');

  const esito = await verifyGpxToken(token, secret, Math.floor(Date.now() / 1000));
  if (!esito.ok) {
    return pagina(
      403,
      esito.reason === 'expired'
        ? 'This download link has expired. Ask for the route again and we send you a fresh one.'
        : 'This download link is not valid. Ask for the route again and we send you a working one.',
    );
  }

  const track = await fetch(new URL(`/gpx/${esito.file}`, url.origin));
  if (!track.ok) return pagina(404, 'Route not found.');
  const trackGpx = await track.text();

  // I POI sono un di piu': se il JSON non risponde si consegna comunque la
  // traccia. Meglio un file povero che nessun file, l'utente l'ha chiesto.
  let poi = [];
  let points = [];
  try {
    const res = await fetch(new URL(`/data/itinerari/${esito.slug}.json`, url.origin));
    if (res.ok) {
      const dati = await res.json();
      poi = dati.poi || [];
      points = dati.points || [];
    }
  } catch {
    /* si consegna la traccia nuda */
  }

  return new Response(buildEnrichedGpx(trackGpx, poi, points), {
    status: 200,
    headers: {
      'Content-Type': 'application/gpx+xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${esito.file}"`,
      // il link e' personale e a scadenza: non deve finire in nessuna cache
      'Cache-Control': 'private, no-store',
    },
  });
}

function pagina(status, messaggio) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Tuscany Trail 365</title>` +
      `<div style="font-family:Georgia,serif;max-width:520px;margin:12vh auto;padding:0 20px;line-height:1.6;color:#222">` +
      `<p style="font-size:18px">${messaggio}</p>` +
      `<p><a href="/itinerari/" style="color:#a80030;font-weight:600">Back to the routes &rarr;</a></p>` +
      `</div>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
