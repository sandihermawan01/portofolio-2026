import "server-only";

import { getServerEnv } from "@/config/env";
import type { ContributionCalendar, ContributionDay, ContributionWeek, CommitSummary } from "@/types/github";

/**
 * Thin GitHub API client — server-only (uses `GITHUB_TOKEN`, which must
 * never reach the browser). Two GitHub APIs are used, matching what each is
 * actually good at:
 *  - GraphQL for the contribution calendar: REST has no equivalent endpoint
 *    for a user's contribution heatmap.
 *  - REST for repository metadata and commits: simpler and more stable for
 *    these than the equivalent GraphQL queries.
 *
 * Every function here throws on failure (network error, non-2xx, malformed
 * body). Callers (src/lib/github/sync.ts) are responsible for catching
 * per-section and falling back to the last good cache value — this module
 * itself does not know about Firestore or caching.
 */

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const GITHUB_REST_BASE = "https://api.github.com";
const USER_AGENT = "portfolio-github-activity-widget";

export class GithubApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "GithubApiError";
  }
}

function authHeaders(): Record<string, string> {
  const token = getServerEnv().GITHUB_TOKEN;
  if (!token) {
    throw new GithubApiError("GITHUB_TOKEN is not configured");
  }
  return {
    Authorization: `Bearer ${token}`,
    "User-Agent": USER_AGENT,
  };
}

const CONTRIBUTIONS_QUERY = `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

/** Fetches the last 12 months of contribution activity for `username`.
 * `level` (0–4) is computed here from count quartiles across the whole
 * fetched range so the UI never needs raw counts to pick a shade — a
 * reasonable approximation of GitHub's own heatmap levels without trying to
 * reverse-engineer their exact (undocumented) thresholds. */
export async function fetchContributionCalendar(username: string): Promise<ContributionCalendar> {
  const res = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: CONTRIBUTIONS_QUERY, variables: { login: username } }),
    // GraphQL responses here are small and change slowly; this function is
    // only ever called from the sync job, never from a request path a
    // visitor is waiting on, so no explicit cache directive is needed.
  });

  if (!res.ok) {
    throw new GithubApiError(`GitHub GraphQL request failed (${res.status})`, res.status);
  }

  const json = (await res.json()) as {
    errors?: Array<{ message: string }>;
    data?: {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: number;
            weeks: Array<{ contributionDays: Array<{ date: string; contributionCount: number }> }>;
          };
        };
      } | null;
    };
  };

  if (json.errors?.length) {
    throw new GithubApiError(`GitHub GraphQL error: ${json.errors[0]?.message ?? "unknown"}`);
  }
  if (!json.data?.user) {
    throw new GithubApiError(`GitHub user "${username}" not found`);
  }

  const calendar = json.data.user.contributionsCollection.contributionCalendar;
  const allCounts = calendar.weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount));
  const level = levelBucketer(allCounts);

  const weeks: ContributionWeek[] = calendar.weeks.map((week) => ({
    days: week.contributionDays.map(
      (day): ContributionDay => ({
        date: day.date,
        count: day.contributionCount,
        level: level(day.contributionCount),
      })
    ),
  }));

  return { totalContributions: calendar.totalContributions, weeks };
}

/** Builds a function mapping a raw count to a 0–4 shade level, based on the
 * quartiles of the non-zero counts in `allCounts`. A count of 0 is always
 * level 0. */
function levelBucketer(allCounts: number[]): (count: number) => 0 | 1 | 2 | 3 | 4 {
  const nonZero = allCounts.filter((c) => c > 0).sort((a, b) => a - b);
  if (nonZero.length === 0) {
    return () => 0;
  }
  const q = (p: number) => nonZero[Math.min(nonZero.length - 1, Math.floor(p * nonZero.length))]!;
  const q25 = q(0.25);
  const q50 = q(0.5);
  const q75 = q(0.75);

  return (count: number) => {
    if (count <= 0) return 0;
    if (count <= q25) return 1;
    if (count <= q50) return 2;
    if (count <= q75) return 3;
    return 4;
  };
}

export interface RepoMetadataResult {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  url: string;
  updatedAt: string;
  pushedAt: string;
  isPrivate: boolean;
}

/** Fetches public metadata for one repo. Throws if the repo doesn't exist,
 * isn't reachable with the configured token, or (deliberately) if it's
 * private — this widget only ever shows public work. */
export async function fetchRepoMetadata(owner: string, repo: string): Promise<RepoMetadataResult> {
  const res = await fetch(`${GITHUB_REST_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
    headers: { ...authHeaders(), Accept: "application/vnd.github+json" },
  });

  if (!res.ok) {
    throw new GithubApiError(`Failed to fetch repo ${owner}/${repo} (${res.status})`, res.status);
  }

  const json = (await res.json()) as {
    name: string;
    description: string | null;
    language: string | null;
    topics?: string[];
    html_url: string;
    updated_at: string;
    pushed_at: string;
    private: boolean;
  };

  if (json.private) {
    throw new GithubApiError(`Repo ${owner}/${repo} is private — skipping (public widget shows public work only)`);
  }

  return {
    name: json.name,
    description: json.description,
    language: json.language,
    topics: json.topics ?? [],
    url: json.html_url,
    updatedAt: json.updated_at,
    pushedAt: json.pushed_at,
    isPrivate: json.private,
  };
}

/** Fetches the most recent commits on a repo's default branch, newest
 * first. `limit` caps the REST `per_page` query param. */
export async function fetchLatestCommits(owner: string, repo: string, limit: number): Promise<CommitSummary[]> {
  const res = await fetch(
    `${GITHUB_REST_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=${limit}`,
    { headers: { ...authHeaders(), Accept: "application/vnd.github+json" } }
  );

  if (!res.ok) {
    // A brand-new empty repo returns 409 "Git Repository is empty" — treat
    // that as "no commits yet" rather than a hard error.
    if (res.status === 409) return [];
    throw new GithubApiError(`Failed to fetch commits for ${owner}/${repo} (${res.status})`, res.status);
  }

  const json = (await res.json()) as Array<{
    sha: string;
    html_url: string;
    commit: { message: string; committer: { date: string } | null; author: { date: string } | null };
  }>;

  return json.map((c) => ({
    repoFullName: `${owner}/${repo}`,
    sha: c.sha,
    shortSha: c.sha.slice(0, 7),
    // First line only — commit bodies can be long and aren't meant for a
    // one-line "latest commits" list.
    message: c.commit.message.split("\n")[0] ?? "",
    url: c.html_url,
    committedAt: c.commit.committer?.date ?? c.commit.author?.date ?? new Date(0).toISOString(),
  }));
}
