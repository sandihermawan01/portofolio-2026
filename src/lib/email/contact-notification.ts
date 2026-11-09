import "server-only";

import { getServerEnv, isContactEmailConfigured } from "@/config/env";

export interface ContactSubmission {
  name: string;
  email: string;
  message: string;
}

/**
 * Sends the owner an email notification for a new contact form message, by
 * calling Resend's REST API directly with `fetch` — deliberately NOT the
 * `resend` npm package, to avoid adding a new dependency for what is a
 * single, simple POST request (see the project's "drop a dependency
 * unless justified" rule in the master prompt).
 *
 * This is called AFTER the message is already durably saved to Firestore
 * (see `features/contact/actions.ts`) and its result never fails that
 * submission — a visitor's message is safe in the database regardless of
 * whether this email goes through, so the caller only logs failures here,
 * it doesn't surface them to the visitor.
 *
 * The visitor's own address is set as `reply_to`, not `from` — emails are
 * sent from a domain Resend has verified for this account
 * (`CONTACT_EMAIL_FROM`), never spoofed as the visitor, which would fail
 * SPF/DKIM checks anyway. Replying to the notification email goes
 * straight back to the visitor.
 */
export async function sendContactNotification(submission: ContactSubmission): Promise<{ ok: boolean; error?: string }> {
  if (!isContactEmailConfigured()) {
    return { ok: false, error: "not_configured" };
  }

  const env = getServerEnv();

  // CONTACT_NOTIFICATION_EMAIL is guaranteed set by isContactEmailConfigured() above.
  const to = env.CONTACT_NOTIFICATION_EMAIL as string;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Portfolio Contact <${env.CONTACT_EMAIL_FROM}>`,
        to: [to],
        reply_to: submission.email,
        subject: `Pesan baru dari ${submission.name} (Portfolio Contact Form)`,
        text: renderPlainText(submission),
        html: renderHtml(submission),
      }),
    });

    if (!res.ok) {
      // Resend returns a JSON error body; read it for the log but never
      // let a malformed body throw past this point.
      const body = await res.text().catch(() => "");
      return { ok: false, error: `resend_${res.status}: ${body.slice(0, 300)}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown_error" };
  }
}

function renderPlainText({ name, email, message }: ContactSubmission): string {
  return [`Pesan baru dari form contact portofolio.`, ``, `Nama: ${name}`, `Email: ${email}`, ``, `Pesan:`, message].join(
    "\n"
  );
}

function renderHtml({ name, email, message }: ContactSubmission): string {
  // Minimal, no external assets/CSS frameworks — kept intentionally plain
  // so it renders consistently across email clients. User-provided fields
  // are escaped since they're interpolated into HTML.
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  return `
    <div style="font-family: monospace; max-width: 560px;">
      <p>Pesan baru dari form contact portofolio.</p>
      <p><strong>Nama:</strong> ${esc(name)}<br/>
      <strong>Email:</strong> ${esc(email)}</p>
      <p><strong>Pesan:</strong></p>
      <p style="white-space: pre-wrap;">${esc(message)}</p>
    </div>
  `.trim();
}
