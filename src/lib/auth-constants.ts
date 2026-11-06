/**
 * Shared constants between Edge-runtime code (middleware) and Node-runtime
 * code (lib/firebase/auth.ts, route handlers).
 *
 * This file MUST stay free of any Node-only or firebase-admin imports.
 * `src/middleware.ts` runs on the Edge runtime, and Next.js bundles
 * whatever it imports (transitively) for that runtime; firebase-admin
 * depends on Node built-ins (`node:process`, `node:stream`, eval-based
 * protobuf codegen, …) that the Edge runtime can't run, which breaks the
 * build if middleware ever imports anything from lib/firebase/auth.ts or
 * lib/firebase/admin.ts directly or indirectly. Keeping the cookie name in
 * its own zero-dependency module is what lets middleware check "is a
 * session cookie present" without pulling in the Admin SDK.
 */
export const SESSION_COOKIE_NAME = "__session";
