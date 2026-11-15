import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { isGithubIntegrationConfigured } from "@/config/env";
import { fetchContributionCalendar, fetchRepoMetadata, fetchLatestCommits, GithubApiError } from "./client";
import type { GithubConfig, RepoActivity, CommitSummary, SyncResult } from "@/types/github";

const CONFIG_DOC_PATH = "github/config";
const CACHE_DOC_PATH = "github/cache";

// Fetched per repo before merging + sorting across all selected repos, so
// the global top-N can still surface a repo whose most recent commit isn't
// its *very* latest fetched one relative to others.
const COMMITS_PER_REPO_FETCH = 5;
// This used to be the final display count too (3), but the cache is also
// now the source for the "Now" page's per-repo commit list — which needs
// up to 5 commits for ONE specific repo, not a blend of the top few across
// every selected repo. A generous cap here just bounds the cache doc's
// size; each individual page (the GitHub Activity page, the Now page)
// slices down to however many it actually wants to show at render time.
const CACHED_COMMITS_COUNT = 30;

/**
 * Runs a full GitHub Activity sync: contribution calendar + metadata for
 * every selected repo + their most recent commits (merged, sorted, capped
 * at `CACHED_COMMITS_COUNT` — see that constant's own comment for why this
 * is no longer just "the 3 shown on the GitHub page"). Writes the result
 * to `github/cache` (merge: true) via the Admin SDK.
 *
 * Fallback behavior (per the product requirement "pakai data cache
 * terakhir jika GitHub API gagal"): each section is fetched independently
 * and a failure in one never touches that section's existing cached
 * value — only a section that succeeds (or is intentionally now empty,
 * e.g. the admin cleared `selectedRepos`) gets overwritten. Errors are
 * collected and stored in `lastSyncErrors` so the admin can see what's
 * stale without reading server logs.
 *
 * Called from three places: the manual "Sync Now" admin Server Action, the
 * `/api/github/sync` cron route, and the `/api/github/webhook` route.
 */
export async function syncGithubActivity(): Promise<SyncResult> {
  const errors: string[] = [];

  if (!isGithubIntegrationConfigured()) {
    const message = "GITHUB_TOKEN belum diset — sinkronisasi dilewati.";
    await adminDb.doc(CACHE_DOC_PATH).set(
      { lastSyncErrors: [message], lastSyncedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return { ok: false, errors: [message], syncedAt: new Date().toISOString() };
  }

  const configSnap = await adminDb.doc(CONFIG_DOC_PATH).get();
  const config = (configSnap.data() ?? {}) as Partial<GithubConfig>;
  const selectedRepos = config.selectedRepos ?? [];

  const update: Record<string, unknown> = {};

  // 1. Contribution calendar
  if (config.username) {
    try {
      update.contributions = await fetchContributionCalendar(config.username);
      update.contributionsFetchedAt = FieldValue.serverTimestamp();
    } catch (e) {
      errors.push(describeError("Contribution calendar", e));
      // Deliberately don't touch update.contributions — previous cached
      // value (if any) stays as-is thanks to `merge: true` below.
    }
  } else {
    // No username configured is an intentional empty state, not a failure.
    update.contributions = null;
    update.contributionsFetchedAt = FieldValue.serverTimestamp();
  }

  // 2 & 3. Repo metadata + latest commits, both driven by the same
  // selectedRepos list, fetched per-repo so one bad repo doesn't take down
  // the others.
  if (selectedRepos.length === 0) {
    update.repos = [];
    update.reposFetchedAt = FieldValue.serverTimestamp();
    update.commits = [];
    update.commitsFetchedAt = FieldValue.serverTimestamp();
  } else {
    const repoResults: RepoActivity[] = [];
    let anyRepoSucceeded = false;
    const allCommits: CommitSummary[] = [];
    let anyCommitsSucceeded = false;

    for (const sel of selectedRepos) {
      try {
        const meta = await fetchRepoMetadata(sel.owner, sel.repo);
        repoResults.push({
          owner: sel.owner,
          repo: sel.repo,
          status: sel.status,
          sortOrder: sel.sortOrder,
          name: meta.name,
          description: meta.description,
          language: meta.language,
          topics: meta.topics,
          url: meta.url,
          updatedAt: meta.updatedAt,
          pushedAt: meta.pushedAt,
        });
        anyRepoSucceeded = true;
      } catch (e) {
        errors.push(describeError(`Repo ${sel.owner}/${sel.repo}`, e));
      }

      try {
        const commits = await fetchLatestCommits(sel.owner, sel.repo, COMMITS_PER_REPO_FETCH);
        allCommits.push(...commits);
        anyCommitsSucceeded = true;
      } catch (e) {
        errors.push(describeError(`Commits for ${sel.owner}/${sel.repo}`, e));
      }
    }

    if (anyRepoSucceeded) {
      update.repos = repoResults.sort((a, b) => a.sortOrder - b.sortOrder);
      update.reposFetchedAt = FieldValue.serverTimestamp();
    }
    if (anyCommitsSucceeded) {
      allCommits.sort((a, b) => new Date(b.committedAt).getTime() - new Date(a.committedAt).getTime());
      update.commits = allCommits.slice(0, CACHED_COMMITS_COUNT);
      update.commitsFetchedAt = FieldValue.serverTimestamp();
    }
  }

  update.lastSyncedAt = FieldValue.serverTimestamp();
  update.lastSyncErrors = errors;

  await adminDb.doc(CACHE_DOC_PATH).set(update, { merge: true });

  return { ok: errors.length === 0, errors, syncedAt: new Date().toISOString() };
}

function describeError(label: string, e: unknown): string {
  if (e instanceof GithubApiError) return `${label}: ${e.message}`;
  if (e instanceof Error) return `${label}: ${e.message}`;
  return `${label}: unknown error`;
}
