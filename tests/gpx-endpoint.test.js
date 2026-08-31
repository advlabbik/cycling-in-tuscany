import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet } from '../functions/api/gpx.js';
import { signGpxToken } from '../lib/gpx-token.js';

const SECRET = 'secret-di-prova-non-quello-vero';
const ORIGIN = 'https://365.tuscanytrail.it';

const TRACK = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="cit" xmlns="http://www.topografix.com/GPX/1/1">
<trk><name>VT - Gravel 1</name><trkseg>
<trkpt lat="43.02884" lon="10.56358"><ele>6.8</ele></trkpt>
</trkseg></trk>
</gpx>`;

const JSON_ITINERARIO = {
  slug: 'vt-gravel-1',
  kmTot: 68.6,
  points: [[43.02884, 10.56358, 6, 0.0]],
  poi: [{ t: 'a', name: '', sub: 'fountain', luogo: 'San Lorenzo', lat: null, lng: null, km: 0.0 }],
};

const fetchVero = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = async (input) => {
    const u = String(input);
    if (u.endsWith('/gpx/VT-Gravel-1.gpx')) return new Response(TRACK, { status: 200 });
    if (u.endsWith('/data/itinerari/vt-gravel-1.json'))
      return new Response(JSON.stringify(JSON_ITINERARIO), { status: 200 });
    return new Response('not found', { status: 404 });
  };
});

afterEach(() => {
  globalThis.fetch = fetchVero;
});

const ctx = (t) => ({
  request: new Request(`${ORIGIN}/api/gpx?t=${encodeURIComponent(t)}`),
  env: { GPX_LINK_SECRET: SECRET },
});

test('senza token valido non consegna il file', async () => {
  const res = await onRequestGet(ctx('spazzatura'));

  assert.equal(res.status, 403);
  const body = await res.text();
  assert.doesNotMatch(body, /<trkpt/);
});

test('con un token valido consegna il GPX arricchito come allegato', async () => {
  const exp = Math.floor(Date.now() / 1000) + 86400;
  const token = await signGpxToken('vt-gravel-1', exp, SECRET, 'VT-Gravel-1.gpx');

  const res = await onRequestGet(ctx(token));

  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /gpx/);
  assert.match(res.headers.get('content-disposition'), /attachment; filename="VT-Gravel-1\.gpx"/);

  const body = await res.text();
  assert.match(body, /<wpt lat="43\.02884" lon="10\.56358">/);
  assert.match(body, /<name>Fountain · San Lorenzo<\/name>/);
  assert.match(body, /<trkpt lat="43\.02884"/); // la traccia originale resta
});

test('un token scaduto non consegna il file', async () => {
  const exp = Math.floor(Date.now() / 1000) - 60;
  const token = await signGpxToken('vt-gravel-1', exp, SECRET, 'VT-Gravel-1.gpx');

  const res = await onRequestGet(ctx(token));

  assert.equal(res.status, 403);
});
