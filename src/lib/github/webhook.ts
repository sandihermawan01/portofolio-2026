import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies a GitHub webhook's `X-Hub-Signature-256` header.
 *
 * Deliberately a small, pure, dependency-free function (no `server-only`
 * guard, no Firestore/env import) so it can be unit-tested directly without
 * spinning up Next.js or an emulator — see tests/unit/github-webhook.test.ts.
 * The caller (src/app/api/github/webhook/route.ts) is responsible for
 * reading the raw request body and the secret from env.
 *
 * Uses `timingSafeEqual` rather than `===` to avoid leaking how much of the
 * signature matched via response-time differences (a standard HMAC
 * verification precaution, not a response to any specific known attack on
 * GitHub's webhooks specifically).
 */
export function verifyGithubWebhookSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;

  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signatureHeader, "utf8");

  // timingSafeEqual throws on length mismatch rather than returning false,
  // so check that first (length alone leaking is an acceptable, unavoidable
  // side channel here — it reveals nothing about the secret).
  if (expectedBuf.length !== actualBuf.length) return false;

  return timingSafeEqual(expectedBuf, actualBuf);
}
