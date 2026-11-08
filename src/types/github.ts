import type { GithubConfigInput, RepoSelectionInput } from "@/lib/validations/github";

export type { RepoSelectionInput as RepoSelection };

/** Firestore doc `github/config` — admin-managed settings. */
export interface GithubConfig extends GithubConfigInput {
  updatedAt: string;
}

/** One day's contribution count, as returned by GitHub's GraphQL
 * contributionsCollection. `level` is derived client-side-safe (computed at
 * sync time) from count quartiles so the heatmap never needs raw counts to
 * pick a shade — 0 (no contributions) through 4 (highest). */
export interface ContributionDay {
  date: string; // ISO date, e.g. "2026-03-14"
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

/** Enriched metadata for one repo the admin selected, fetched from the
 * GitHub REST API at sync time. `status` and `sortOrder` come from the
 * admin's own selection (github/config), not from GitHub. */
export interface RepoActivity {
  owner: string;
  repo: string;
  status: RepoSelectionInput["status"];
  sortOrder: number;
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  url: string;
  updatedAt: string;
  pushedAt: string;
}

export interface CommitSummary {
  repoFullName: string; // "owner/repo"
  sha: string;
  shortSha: string;
  message: string;
  url: string;
  committedAt: string;
}

/** Firestore doc `github/cache` — machine-written only (sync job / webhook
 * via Admin SDK). Never written through a client SDK call, by anyone,
 * admin included — see firebase/firestore.rules and
 * src/lib/github/sync.ts. */
export interface GithubCache {
  contributions: ContributionCalendar | null;
  contributionsFetchedAt: string | null;
  repos: RepoActivity[];
  reposFetchedAt: string | null;
  commits: CommitSummary[];
  commitsFetchedAt: string | null;
  lastSyncedAt: string | null;
  /** Non-fatal errors from the most recent sync attempt, per section, so the
   * admin can see why a piece might be stale without digging through server
   * logs. Never contains the raw token or full response bodies. */
  lastSyncErrors: string[];
}

export interface SyncResult {
  ok: boolean;
  errors: string[];
  syncedAt: string;
}
