/**
 * Browser shim for the `jsonwebtoken` package.
 *
 * The MSW mock layer uses `jwt.decode()` (in `auth-helpers.ts`) to read the
 * `{ userId, establishmentId, role }` payload out of the access token, and the
 * demo layer uses `jwt.sign()` to produce that token. The real package depends
 * on Node's crypto/Buffer and cannot be bundled for the browser, so we provide
 * a minimal, signature-less implementation: tokens are
 * `base64url(header).base64url(payload).demo` and we only ever read the payload.
 *
 * Aliased in `vite.config.mts` for non-test builds only; tests use the real
 * `jsonwebtoken`.
 */

function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decode(
  token: string,
  _options?: { json?: boolean; complete?: boolean }
): Record<string, unknown> | null {
  if (!token || typeof token !== 'string') {
    return null;
  }
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

export function sign(
  payload: Record<string, unknown>,
  _secret?: unknown,
  _options?: unknown
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  return [
    base64UrlEncode(JSON.stringify(header)),
    base64UrlEncode(JSON.stringify(payload)),
    'demo'
  ].join('.');
}

export function verify(token: string): Record<string, unknown> | null {
  return decode(token);
}

export default { decode, sign, verify };
