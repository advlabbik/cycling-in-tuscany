/**
 * Token firmato per il link di download del GPX.
 *
 * HMAC-SHA256 via Web Crypto: la stessa API esiste nelle Pages Functions e in
 * Node, quindi il modulo gira identico in produzione e sotto test.
 *
 * Il payload e' `slug:scadenza` e basta. L'email NON ci sta dentro di
 * proposito: legarla non impedisce comunque di girare il link a un amico
 * (non c'e' login), e in cambio ficcherebbe un indirizzo email dentro un URL
 * che finisce nei log di Cloudflare e nei referer. Costo certo, beneficio no.
 *
 * ⚠️ Questo e' un DETERRENTE, non una serratura: ferma chi indovina gli URL e
 * gli scraper, non chi inoltra l'email a un amico.
 */

const enc = new TextEncoder();

function b64urlEncode(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function key(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

/** `expiresAt` e `now` sono secondi epoch. Ne' slug ne' file possono contenere
    ':' (lo slug e' [a-z0-9-], il file e' validato in lead.js), quindi i tre
    campi si separano senza ambiguita'. */
export async function signGpxToken(slug, expiresAt, secret, file = '') {
  const payload = `${slug}:${file}:${expiresAt}`;
  const sig = await crypto.subtle.sign('HMAC', await key(secret), enc.encode(payload));
  return `${b64urlEncode(enc.encode(payload))}.${b64urlEncode(new Uint8Array(sig))}`;
}

export async function verifyGpxToken(token, secret, now) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed' };

  let payload;
  try {
    payload = new TextDecoder().decode(b64urlDecode(parts[0]));
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  let sig;
  try {
    sig = b64urlDecode(parts[1]);
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  // crypto.subtle.verify confronta in tempo costante: non si scrive a mano
  const valido = await crypto.subtle.verify('HMAC', await key(secret), sig, enc.encode(payload));
  if (!valido) return { ok: false, reason: 'bad signature' };

  const campi = payload.split(':');
  if (campi.length !== 3) return { ok: false, reason: 'malformed' };
  const [slug, file, exp] = campi;
  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt)) return { ok: false, reason: 'malformed' };
  if (now > expiresAt) return { ok: false, reason: 'expired' };

  return { ok: true, slug, file, expiresAt };
}
