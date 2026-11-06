import "server-only";

/**
 * CSRF / origin check for cookie-based privileged requests (session login,
 * logout, and any admin mutation reachable via a browser form or fetch with
 * credentials). Session cookies alone don't stop CSRF, since browsers
 * attach cookies automatically to cross-site requests — this check verifies
 * the request actually originated from our own site before anything else
 * runs. `SameSite=Lax` on the cookie (see `lib/firebase/session-cookie
 * options`) is the first layer; this is the second.
 */
export function isTrustedOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) return false;

  // Browsers always send `Origin` on state-changing cross-origin-capable
  // requests (POST/PUT/PATCH/DELETE with a body, or fetch with
  // credentials). If it's missing on one of those, fail closed.
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    const expectedUrl = new URL(siteUrl);
    return originUrl.origin === expectedUrl.origin;
  } catch {
    return false;
  }
}
