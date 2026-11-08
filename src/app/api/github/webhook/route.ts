import { NextResponse, type NextRequest } from "next/server";
import { verifyGithubWebhookSignature } from "@/lib/github/webhook";
import { syncGithubActivity } from "@/lib/github/sync";
import { getGithubConfig } from "@/features/github/queries";
import { getServerEnv } from "@/config/env";

/**
 * GitHub push webhook target — lets the GitHub Activity cache refresh
 * near-real-time after a push, instead of waiting for the next 6-hourly
 * cron run (src/app/api/github/sync/route.ts).
 *
 * Setup (documented in README): on each selected repo (or an org-wide
 * webhook), add a webhook pointing at
 * `https://<your-site>/api/github/webhook`, content type
 * `application/json`, secret = `GITHUB_WEBHOOK_SECRET`, event: "Just the
 * push event".
 *
 * Security: the signature check below is the ONLY gate on this endpoint —
 * there's no admin session involved, so if `GITHUB_WEBHOOK_SECRET` isn't
 * set, this route refuses every request rather than running an
 * unauthenticated resync for anyone who finds the URL.
 */
export async function POST(req: NextRequest) {
  const env = getServerEnv();

  if (!env.GITHUB_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "GITHUB_WEBHOOK_SECRET belum dikonfigurasi di server." }, { status: 503 });
  }

  // Read the RAW body for signature verification before any JSON parsing —
  // GitHub signs the exact bytes it sent, and re-serializing a parsed
  // object is not guaranteed to produce byte-identical output.
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyGithubWebhookSignature(rawBody, signature, env.GITHUB_WEBHOOK_SECRET)) {
    return NextResponse.json({ ok: false, error: "Signature tidak valid." }, { status: 401 });
  }

  const event = req.headers.get("x-github-event");
  if (event !== "push") {
    // GitHub also sends a "ping" event when a webhook is first created —
    // acknowledge it (200) without doing any work, so the webhook shows as
    // healthy in GitHub's UI immediately after setup.
    return NextResponse.json({ ok: true, skipped: `event "${event}" ignored` });
  }

  let payload: { repository?: { full_name?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Payload tidak valid." }, { status: 400 });
  }

  const pushedRepo = payload.repository?.full_name?.toLowerCase();
  if (!pushedRepo) {
    return NextResponse.json({ ok: false, error: "Payload tidak mengandung nama repository." }, { status: 400 });
  }

  // Light sanity check: only resync if the push is for a repo the admin
  // actually tracks. Saves a GitHub API round-trip for a webhook that's
  // technically authentic but irrelevant (e.g. a repo later removed from
  // selectedRepos without its webhook being deleted too).
  const config = await getGithubConfig();
  const isTracked = config.selectedRepos.some((r) => `${r.owner}/${r.repo}`.toLowerCase() === pushedRepo);

  if (!isTracked) {
    return NextResponse.json({ ok: true, skipped: `"${pushedRepo}" is not a tracked repo` });
  }

  const result = await syncGithubActivity();
  return NextResponse.json(result, { status: result.ok ? 200 : 207 });
}
