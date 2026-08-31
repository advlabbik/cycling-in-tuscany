import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/lead.js';
import { verifyGpxToken } from '../lib/gpx-token.js';

const SECRET = 'secret-di-prova-non-quello-vero';
const ORIGIN = 'https://365.tuscanytrail.it';

const fetchVero = globalThis.fetch;
let inviata; // il corpo della chiamata /v3/smtp/email

beforeEach(() => {
  inviata = null;
  globalThis.fetch = async (input, init) => {
    const u = String(input);
    if (u.endsWith('/v3/contacts')) return new Response('', { status: 201 });
    if (u.endsWith('/v3/smtp/email')) {
      inviata = JSON.parse(init.body);
      return new Response('{}', { status: 201 });
    }
    return new Response('not found', { status: 404 });
  };
});

afterEach(() => {
  globalThis.fetch = fetchVero;
});

const richiesta = () => ({
  request: new Request(`${ORIGIN}/api/lead`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'prova@example.com',
      consent: true,
      itinerary: '/itinerari/vt-gravel-1/',
      gpx: '/gpx/VT-Gravel-1.gpx',
      lang: 'en',
    }),
  }),
  env: { BREVO_API_KEY: 'chiave', BREVO_LIST_ID: '29', GPX_LINK_SECRET: SECRET },
});

test("il link nell'email punta all'endpoint firmato, non al file pubblico", async () => {
  // Il punto di tutto il lavoro: chi passa dal form deve ricevere il file
  // arricchito, non lo stesso URL che chiunque puo' scaricare a mano.
  await onRequestPost(richiesta());

  assert.ok(inviata, "l'email non e' stata inviata");
  assert.match(inviata.htmlContent, /\/api\/gpx\?t=/);
  assert.doesNotMatch(inviata.htmlContent, /\/gpx\/VT-Gravel-1\.gpx/);
});

test("il token nel link e' valido e punta al percorso richiesto", async () => {
  await onRequestPost(richiesta());

  const token = inviata.htmlContent.match(/\/api\/gpx\?t=([A-Za-z0-9._-]+)/)[1];
  const esito = await verifyGpxToken(token, SECRET, Math.floor(Date.now() / 1000));

  assert.equal(esito.ok, true);
  assert.equal(esito.slug, 'vt-gravel-1');
  assert.equal(esito.file, 'VT-Gravel-1.gpx');
});
