import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEnrichedGpx } from '../lib/gpx-enrich.js';

const TRACK = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="cit" xmlns="http://www.topografix.com/GPX/1/1">
<trk><name>MR - Gravel 2</name><trkseg>
<trkpt lat="43.147183" lon="10.856119"><ele>514.7</ele></trkpt>
</trkseg></trk>
</gpx>`;

test('inserisce un <wpt> per ogni POI con coordinate', () => {
  const out = buildEnrichedGpx(TRACK, [
    { t: 'a', name: 'Fonte del Prato', lat: 43.1, lng: 10.8, km: 12.3 },
    { t: 'm', name: 'Bar Centrale', lat: 43.2, lng: 10.9, km: 30 },
  ]);

  const wpts = out.match(/<wpt\b/g) || [];
  assert.equal(wpts.length, 2);
  assert.match(out, /<wpt lat="43\.1" lon="10\.8">/);
  assert.match(out, /<name>Fonte del Prato<\/name>/);
});

test("fa l'escape dei caratteri XML nei nomi", () => {
  // Nei dati veri esistono "PuntAla Camp & Resort" e "B&B Al Pozzolone":
  // una & non scappata rende il documento non valido e l'import fallisce.
  const out = buildEnrichedGpx(TRACK, [
    { t: 'd', name: 'PuntAla Camp & Resort', lat: 42.8, lng: 10.7, km: 5 },
  ]);

  assert.match(out, /<name>PuntAla Camp &amp; Resort<\/name>/);
  assert.doesNotMatch(out, /& /);
});

// [lat, lng, ele, km] — stesso formato di public/data/itinerari/<slug>.json
const POINTS = [
  [43.0, 10.0, 5, 0.0],
  [43.1, 10.1, 5, 10.0],
  [43.2, 10.2, 5, 20.0],
  [43.3, 10.3, 5, 30.0],
];

test('ricava le coordinate dal km per i POI che non le hanno', () => {
  // 240 POI su 363 hanno solo il km: scartarli butterebbe due terzi del valore.
  const out = buildEnrichedGpx(TRACK, [{ t: 'a', sub: 'fountain', lat: null, lng: null, km: 19.4 }], POINTS);

  assert.match(out, /<wpt lat="43\.2" lon="10\.2">/);
  assert.doesNotMatch(out, /undefined|null|NaN/);
});

test('compone un nome leggibile quando il POI non ne ha uno', () => {
  // Le fontane arrivano da OSM senza name: restano "Fountain" + il paese.
  const out = buildEnrichedGpx(
    TRACK,
    [{ t: 'a', name: '', sub: 'fountain', luogo: 'San Lorenzo', lat: 43.5, lng: 10.5, km: 22.9 }],
    POINTS,
  );

  assert.match(out, /<name>Fountain · San Lorenzo<\/name>/);
});

test('mette il km nella descrizione del waypoint', () => {
  // Su un ciclocomputer il km e' l'informazione che rende il punto utile:
  // dice quanto manca all'acqua.
  const out = buildEnrichedGpx(TRACK, [{ t: 'a', name: 'Fonte', lat: 43.1, lng: 10.1, km: 12.3 }], POINTS);

  assert.match(out, /<desc>km 12\.3<\/desc>/);
});

test('assegna il simbolo Garmin corrispondente al tipo', () => {
  // Senza <sym> il ciclocomputer disegna tutti i punti con la stessa puntina
  // e la distinzione acqua/cibo/officina si perde proprio dove serve.
  const out = buildEnrichedGpx(
    TRACK,
    [
      { t: 'a', name: 'Fonte', lat: 43.1, lng: 10.1, km: 1 },
      { t: 'm', name: 'Bar', lat: 43.2, lng: 10.2, km: 2 },
      { t: 'd', name: 'Hotel', lat: 43.3, lng: 10.3, km: 3 },
    ],
    POINTS,
  );

  assert.match(out, /<name>Fonte<\/name><desc>km 1<\/desc><sym>Drinking Water<\/sym>/);
  assert.match(out, /<sym>Restaurant<\/sym>/);
  assert.match(out, /<sym>Lodging<\/sym>/);
});
