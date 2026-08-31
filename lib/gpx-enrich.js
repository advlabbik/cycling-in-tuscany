/**
 * Arricchimento del GPX: la traccia nuda + i POI come waypoint.
 *
 * In GPX 1.1 l'ordine degli elementi e' fissato dallo schema: metadata, wpt*,
 * rte*, trk*. I waypoint vanno quindi inseriti PRIMA del primo <trk>, non in
 * fondo al file — altrimenti il documento non valida e i ciclocomputer piu'
 * severi rifiutano l'import.
 */

/** Nei dati veri ci sono "PuntAla Camp & Resort" e "B&B Al Pozzolone": senza
    escape il GPX non valida e l'import sul ciclocomputer fallisce. */
function xml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Due terzi dei POI non hanno lat/lng, solo il km a cui cadono lungo il giro.
    Si aggancia il punto della traccia col km piu' vicino: `points` e' la
    polilinea del JSON dell'itinerario, [lat, lng, ele, km]. */
function coords(p, points) {
  if (p.lat != null && p.lng != null) return [p.lat, p.lng];
  if (!points?.length || p.km == null) return null;
  let best = points[0];
  for (const pt of points) {
    if (Math.abs(pt[3] - p.km) < Math.abs(best[3] - p.km)) best = pt;
  }
  return [best[0], best[1]];
}

/** Etichette dei tipi, le stesse del RouteViewer in pagina. */
const LABEL = { a: 'Water', m: 'Food', b: 'Bike shop', d: 'Stay', c: 'Village' };

/** Simboli standard Garmin: senza <sym> il ciclocomputer disegna tutti i punti
    con la stessa puntina e la distinzione acqua/cibo/officina si perde. */
const SYM = {
  a: 'Drinking Water',
  m: 'Restaurant',
  b: 'Shopping Center',
  d: 'Lodging',
  c: 'City (Small)',
};

/** Le fontane arrivano da OSM senza nome: restano il tipo piu' il paese. */
function label(p) {
  const base = p.name || cap(p.sub) || LABEL[p.t] || 'Point';
  return p.name ? base : [base, p.luogo].filter(Boolean).join(' · ');
}

function cap(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}

export function buildEnrichedGpx(trackGpx, poi, points) {
  const wpts = poi
    .map((p) => {
      const c = coords(p, points);
      if (!c) return null;
      return (
        `<wpt lat="${c[0]}" lon="${c[1]}">` +
        `<name>${xml(label(p))}</name>` +
        `<desc>km ${p.km}</desc>` +
        (SYM[p.t] ? `<sym>${SYM[p.t]}</sym>` : '') +
        `</wpt>`
      );
    })
    .filter(Boolean)
    .join('\n');
  return trackGpx.replace('<trk', wpts + '\n<trk');
}
