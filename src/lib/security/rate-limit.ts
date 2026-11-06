/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Deliberately has NO `import "server-only"` guard: this module has zero
 * Node-only or secret-bearing dependencies (it's a plain in-memory Map), so
 * it's safe to import from tests (`tests/unit/rate-limit.test.ts`) that run
 * under plain Node/Vitest rather than inside Next.js. It is still only ever
 * called from server code (API routes) in the app itself — see
 * src/app/api/contact/route.ts and src/app/api/session/route.ts.
 *
 * NOTE on scope: this guards the contact form against casual spam/abuse on
 * a single server instance. It resets on redeploy and does NOT share state
 * across multiple serverless instances. For a multi-instance production
 * deployment, swap the `store` implementation for a shared backend (e.g.
 * Upstash Redis, Firestore counter doc with a transaction, or Vercel KV) —
 * the interface below is intentionally small so that swap is a one-file
 * change. This limitation is called out in the README.
 */

type Bucket = { count: number; windowStart: number };

const store = new Map<string, Bucket>();

// Periodically forget old buckets so the Map doesn't grow unbounded on a
// long-lived server process.
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, max: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  if (store.size > MAX_BUCKETS) {
    for (const [k, b] of store) {
      if (now - b.windowStart > windowMs) store.delete(k);
    }
  }

  const existing = store.get(key);

  if (!existing || now - existing.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  if (existing.count >= max) {
    return { allowed: false, remaining: 0, resetAt: existing.windowStart + windowMs };
  }

  existing.count += 1;
  return { allowed: true, remaining: max - existing.count, resetAt: existing.windowStart + windowMs };
}

/**
 * Best-effort client identifier for rate limiting. `x-forwarded-for` is
 * attacker-controlled on direct requests, but on Vercel/most reverse
 * proxies the first entry is trustworthy; this is a spam deterrent, not an
 * authentication boundary, so that tradeoff is acceptable here.
 */
export function getClientIdentifier(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
