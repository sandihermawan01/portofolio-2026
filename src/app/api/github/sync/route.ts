import { NextResponse, type NextRequest } from "next/server";
import { syncGithubActivity } from "@/lib/github/sync";
import { getServerEnv } from "@/config/env";

/**
 * Cron-triggered GitHub Activity sync, protected by a shared secret read
 * from `GITHUB_SYNC_CRON_SECRET` and compared against this request's
 * `Authorization: Bearer <secret>` header.
 *
 * IMPORTANT — this is NOT Vercel's auto-injected `Authorization: Bearer
 * $CRON_SECRET` header: that auto-injection only fires for an env var
 * literally named `CRON_SECRET`, and this project deliberately uses the
 * more specific `GITHUB_SYNC_CRON_SECRET` name instead (to avoid colliding
 * with any other cron job this project might add later). `vercel.json`'s
 * `crons` entries cannot attach a custom header, so Vercel Cron alone
 * cannot authenticate against this endpoint as written. To actually
 * schedule this in production, either:
 *   1. Trigger it from an external scheduler that can set a custom header
 *      (a GitHub Actions workflow on a `schedule:` cron, cron-job.org,
 *      etc.) pointed at this URL with
 *      `Authorization: Bearer <GITHUB_SYNC_CRON_SECRET value>`; or
 *   2. Rename the env var to `CRON_SECRET` (update `config/env.ts` and the
 *      check below) to opt into Vercel's automatic header injection.
 * See README.md's GitHub Activity section for the recommended setup.
 *
 * This endpoint is intentionally unauthenticated in the "is this an admin
 * user" sense (there's no browser session calling it) but IS protected by
 * the shared secret above so it can't be used by an arbitrary visitor to
 * spam the GitHub API on this server's behalf — every call here still
 * burns GitHub API rate limit and, if misused repeatedly, could exhaust it
 * for the real sync job too.
 *
 * GET is the primary method (matches Vercel Cron's default and most
 * external schedulers), POST is kept for manual testing with curl — both
 * run the identical, idempotent sync.
 */
async function handleSyncRequest(req: NextRequest): Promise<NextResponse> {
  const env = getServerEnv();

  if (!env.GITHUB_SYNC_CRON_SECRET) {
    // Fail closed: if no secret is configured, this endpoint refuses to run
    // rather than silently accepting unauthenticated requests.
    return NextResponse.json(
      { ok: false, error: "GITHUB_SYNC_CRON_SECRET belum dikonfigurasi di server." },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${env.GITHUB_SYNC_CRON_SECRET}`;

  if (authHeader !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncGithubActivity();
  return NextResponse.json(result, { status: result.ok ? 200 : 207 });
}

export async function GET(req: NextRequest) {
  return handleSyncRequest(req);
}

export async function POST(req: NextRequest) {
  return handleSyncRequest(req);
}
