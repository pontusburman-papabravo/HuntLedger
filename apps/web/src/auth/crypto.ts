/**
 * Tiny WebCrypto helpers used by the LocalStorage auth adapter.
 *
 * DISCLAIMER: this is suitable for the local-only MVP (F1). It is NOT
 * production-grade because:
 *   - The "database" is the user's own localStorage and is trivially
 *     extractable by anyone with access to the device.
 *   - There is no account-recovery, rate limiting, or breach detection.
 *   - PBKDF2 work factor is conservative for snappy local UX.
 *
 * In F2 we replace the entire LocalStorage adapter with FirebaseAuth and
 * delete this file.
 */

const ITERATIONS = 150_000;
const HASH = 'SHA-256';
const KEY_LENGTH_BITS = 256;

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function generateSaltBase64(byteLength = 16): string {
  const buf = new Uint8Array(byteLength);
  crypto.getRandomValues(buf);
  return toBase64(buf);
}

export async function hashPassword(password: string, saltBase64: string): Promise<string> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: HASH,
      salt: fromBase64(saltBase64),
      iterations: ITERATIONS,
    },
    baseKey,
    KEY_LENGTH_BITS,
  );
  return toBase64(new Uint8Array(bits));
}

/** Constant-time-ish comparison of two base64 strings of equal length. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
