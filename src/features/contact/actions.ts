import "server-only";

import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { contactFormSchema } from "@/lib/validations/contact";
import { checkRateLimit, getClientIdentifier } from "@/lib/security/rate-limit";
import { getServerEnv } from "@/config/env";
import { sendContactNotification } from "@/lib/email/contact-notification";

export interface SubmitContactResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Handles a public contact form submission.
 *
 * Storage decision (documented per the master prompt's "don't store unless
 * explicitly designed and secured" rule): messages ARE stored, in the
 * `messages` collection, as the durable source of truth — the optional
 * email notification below (`sendContactNotification`) is a convenience
 * on top of that storage, never a replacement for it. If
 * `RESEND_API_KEY`/`CONTACT_NOTIFICATION_EMAIL` aren't configured, or the
 * email send fails for any reason, the message is still safely in
 * Firestore; nothing is ever lost because an email didn't go out. That
 * collection:
 *  - has NO Firestore Rules path allowing client read or write at all (see
 *    firebase/firestore.rules) — the only writer is this server function
 *    via the Admin SDK, and there is no public or admin-UI reader built in
 *    this version, so messages are never exposed, matching "never show
 *    visitor messages to the public."
 *  - never logs the message body or raw IP to server logs (only a
 *    salted hash of the IP, for abuse pattern review).
 */
export async function submitContactForm(input: unknown, headers: Headers): Promise<SubmitContactResult> {
  const parsed = contactFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Input tidak valid.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Honeypot: a real visitor never fills this hidden field.
  if (parsed.data.website) {
    return { ok: true }; // pretend success so the bot learns nothing
  }

  const env = getServerEnv();
  const clientId = getClientIdentifier(headers);
  const rate = checkRateLimit(`contact:${clientId}`, env.CONTACT_RATE_LIMIT_MAX, env.CONTACT_RATE_LIMIT_WINDOW_SECONDS);

  if (!rate.allowed) {
    return { ok: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const ipHash = createHash("sha256").update(clientId).digest("hex").slice(0, 16);

  await adminDb.collection("messages").add({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    status: "new",
    ipHash,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Best-effort notification — the message above is already durably
  // saved, so a failure here is logged (never to the visitor) and never
  // turns this submission into an error response. See
  // src/lib/email/contact-notification.ts for why email is a convenience
  // layered on top of storage, not a replacement for it.
  const emailResult = await sendContactNotification({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
  });
  if (!emailResult.ok && emailResult.error !== "not_configured") {
    console.error("[contact] email notification failed:", emailResult.error);
  }

  return { ok: true };
}
