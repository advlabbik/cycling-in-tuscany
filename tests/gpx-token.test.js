import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signGpxToken, verifyGpxToken } from '../lib/gpx-token.js';

const SECRET = 'secret-di-prova-non-quello-vero';
const NOW = Date.UTC(2026, 7, 31) / 1000; // 31/8/2026
const GIORNO = 86400;

test('un token appena firmato si verifica e restituisce lo slug', async () => {
  const token = await signGpxToken('vt-gravel-1', NOW + 90 * GIORNO, SECRET);

  const res = await verifyGpxToken(token, SECRET, NOW);

  assert.equal(res.ok, true);
  assert.equal(res.slug, 'vt-gravel-1');
});

test('un token con la firma manomessa viene rifiutato', async () => {
  // Il caso che conta: qualcuno cambia lo slug nell'URL per prendersi gli
  // altri quindici percorsi con un token solo.
  const token = await signGpxToken('vt-gravel-1', NOW + 90 * GIORNO, SECRET);
  const [payload, sig] = token.split('.');
  const altroPayload = (await signGpxToken('pacr-road-1', NOW + 90 * GIORNO, SECRET)).split('.')[0];

  const res = await verifyGpxToken(`${altroPayload}.${sig}`, SECRET, NOW);

  assert.equal(res.ok, false);
  assert.notEqual(payload, altroPayload);
});

test('un token scaduto viene rifiutato', async () => {
  const token = await signGpxToken('vt-gravel-1', NOW + 90 * GIORNO, SECRET);

  const res = await verifyGpxToken(token, SECRET, NOW + 91 * GIORNO);

  assert.equal(res.ok, false);
  assert.equal(res.reason, 'expired');
});

test('il token porta anche il nome del file, non solo lo slug', async () => {
  // Il file si chiama VT-Gravel-1.gpx e lo slug e' vt-gravel-1: oggi la regola
  // di conversione vale per tutti e 16, ma e' implicita. Un percorso nuovo con
  // un nome fuori schema la romperebbe in silenzio, quindi il nome viaggia
  // firmato invece di essere indovinato.
  const token = await signGpxToken('vt-gravel-1', NOW + 90 * GIORNO, SECRET, 'VT-Gravel-1.gpx');

  const res = await verifyGpxToken(token, SECRET, NOW);

  assert.equal(res.ok, true);
  assert.equal(res.slug, 'vt-gravel-1');
  assert.equal(res.file, 'VT-Gravel-1.gpx');
});
