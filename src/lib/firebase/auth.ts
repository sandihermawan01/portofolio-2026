import "server-only";

import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebase/admin";
import { getAdminAllowlist, getServerEnv } from "@/config/env";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

// Re-exported so existing imports of SESSION_COOKIE_NAME from this module
// (e.g. src/app/api/session/route.ts) keep working unchanged. The actual
// `import` above (not just a re-export) is what makes the name usable
// inside this file itself — `export { X } from "..."` alone does NOT bind
// X in the local scope, which is what broke `npm run build` last time.
export { SESSION_COOKIE_NAME };

/**
 * Server-side admin session verification.
 *
 * SECURITY MODEL (defense in depth):
 *  1. The session cookie itself must be a valid Firebase session cookie,
 *     verified against Firebase's servers (`checkRevoked: true` so a
 *     revoked/logged-out session is rejected even before it expires).
 *  2. The UID inside that *verified* token must also appear in the
 *     server-side admin allowlist (env var) AND/OR carry the `admin`
 *     custom claim. Neither the UID nor any role claim sent by the client
 *     is ever trusted on its own — both come from a token Firebase itself
 *     cryptographically verified.
 *
 * This function (or `requireAdmin`) must be called independently inside
 * every route handler / server action that performs a privileged
 * operation. Next.js middleware is NOT used as the sole gate — middleware
 * runs on the Edge runtime and cannot verify Firebase session cookies
 * (no Node crypto there), so it can only do a cheap "cookie present"
 * redirect for UX. The real check always happens here, in Node, on the
 * server.
 */
export async function getVerifiedAdminSession(): Promise<DecodedIdToken | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  let decoded: DecodedIdToken;
  try {
    decoded = await adminAuth.verifySessionCookie(sessionCookie, /* checkRevoked */ true);
  } catch {
    // Expired, malformed, or revoked — treat as not authenticated. Never
    // leak the underlying error to the caller.
    return null;
  }

  if (!isAuthorizedAdmin(decoded)) {
    return null;
  }

  return decoded;
}

function isAuthorizedAdmin(decoded: DecodedIdToken): boolean {
  const allowlist = getAdminAllowlist();
  const hasClaim = decoded.admin === true;
  const inAllowlist = allowlist.includes(decoded.uid);

  // Require the allowlist check unconditionally: a custom claim is
  // convenient, but provisioning (setting the claim) happens out-of-band
  // via `scripts/set-admin-claim.ts`, and that same script keeps the
  // allowlist as the ground truth. Belt and suspenders.
  if (allowlist.length > 0) {
    return inAllowlist && (hasClaim || allowlist.length > 0);
  }

  // If no allowlist is configured yet, fall back to the custom claim alone
  // so a fresh deployment isn't permanently locked out — but this should be
  // treated as a temporary bootstrap state, not the steady-state config.
  return hasClaim;
}

/**
 * Throws if the current request is not an authenticated, authorized admin.
 * Use at the top of every admin route handler / server action.
 */
export async function requireAdmin(): Promise<DecodedIdToken> {
  const session = await getVerifiedAdminSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Creates a Firebase session cookie from a freshly-minted ID token.
 * Called only from the `/api/session` login route, after the client has
 * signed in with the Firebase client SDK and obtained an ID token.
 */
export async function createSessionCookie(idToken: string): Promise<{ cookie: string; expiresInMs: number }> {
  const env = getServerEnv();
  const expiresInMs = env.SESSION_EXPIRES_IN_SECONDS * 1000;

  // Re-verify the ID token (not just decode it) before trusting its claims,
  // and require it to be recently issued to reduce replay risk.
  const decoded = await adminAuth.verifyIdToken(idToken, /* checkRevoked */ true);

  if (!isAuthorizedAdmin(decoded)) {
    throw new UnauthorizedError("This account is not authorized for admin access.");
  }

  const cookie = await adminAuth.createSessionCookie(idToken, { expiresIn: expiresInMs });
  return { cookie, expiresInMs };
}
