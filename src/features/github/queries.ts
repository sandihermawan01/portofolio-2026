import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { timestampToIso } from "@/lib/firebase/convert";
import type { GithubConfig, GithubCache } from "@/types/github";

const CONFIG_DOC_PATH = "github/config";
const CACHE_DOC_PATH = "github/cache";

/** Public + admin read. Returns a safe default (feature effectively off)
 * rather than null, so callers never need a separate "config missing"
 * branch — a fresh install with no github/config doc yet behaves exactly
 * like `widgetVisible: false`. */
export async function getGithubConfig(): Promise<GithubConfig> {
  const snap = await adminDb.doc(CONFIG_DOC_PATH).get();
  const data = snap.data();
  return {
    username: data?.username ?? undefined,
    selectedRepos: data?.selectedRepos ?? [],
    widgetVisible: data?.widgetVisible ?? false,
    updatedAt: timestampToIso(data?.updatedAt),
  };
}

/** Public + admin read of the machine-written cache. Returns a safe empty
 * cache (never null) for the same reason as getGithubConfig — rendering
 * code can treat "never synced yet" as just another empty state. */
export async function getGithubCache(): Promise<GithubCache> {
  const snap = await adminDb.doc(CACHE_DOC_PATH).get();
  const data = snap.data();
  return {
    contributions: data?.contributions ?? null,
    contributionsFetchedAt: data?.contributionsFetchedAt ? timestampToIso(data.contributionsFetchedAt) : null,
    repos: data?.repos ?? [],
    reposFetchedAt: data?.reposFetchedAt ? timestampToIso(data.reposFetchedAt) : null,
    commits: data?.commits ?? [],
    commitsFetchedAt: data?.commitsFetchedAt ? timestampToIso(data.commitsFetchedAt) : null,
    lastSyncedAt: data?.lastSyncedAt ? timestampToIso(data.lastSyncedAt) : null,
    lastSyncErrors: data?.lastSyncErrors ?? [],
  };
}

export const GITHUB_CONFIG_DOC_REF_PATH = CONFIG_DOC_PATH;
export const GITHUB_CACHE_DOC_REF_PATH = CACHE_DOC_PATH;
