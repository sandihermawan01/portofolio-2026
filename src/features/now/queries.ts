import "server-only";

import { getPublishedProjects } from "@/features/projects/queries";
import { getGithubCache } from "@/features/github/queries";
import type { Project } from "@/types/content";
import type { CommitSummary } from "@/types/github";

/** How many commits the "Now" page shows for the featured project — more
 * than the GitHub Activity page's own 3 (see `LATEST_COMMITS_SHOWN` in
 * `github-activity-section.tsx`), per the redesign brief asking for 5
 * here specifically. The cache this reads from keeps up to 30 commits
 * across every selected repo (`CACHED_COMMITS_COUNT` in
 * `lib/github/sync.ts`) precisely so there's enough headroom, after
 * filtering down to just this one repo, to actually reach 5. */
const NOW_COMMITS_LIMIT = 5;

export interface NowData {
  project: Project;
  /** Empty when the project has no `repositoryUrl`, the URL isn't a
   * recognizable github.com repo link, or nothing's been synced for it
   * yet — never null, so the page can treat "no commits to show" as one
   * plain empty state regardless of which of those it is. */
  commits: CommitSummary[];
}

/**
 * The "Now" page has no content of its own to maintain anymore — no
 * separate admin form, no Firestore doc to edit. It's entirely derived
 * from whichever published project is marked Featured / pinned (the
 * existing switch on the Project form), plus that project's own recent
 * commits straight from the GitHub sync cache. Returns null when nothing
 * is currently featured, so the page can show an honest "belum ada
 * project yang di-pin" empty state instead of silently pretending
 * there's always something in progress.
 *
 * `getPublishedProjects()` already sorts featured projects first (then by
 * `sortOrder`, then newest first) — so if the admin ever marks more than
 * one project as featured, this just surfaces whichever one of those
 * would appear first in that order, not a merged "all of them" view. The
 * redesign brief only ever describes a single "what I'm doing right now"
 * slot, not a list.
 */
export async function getNowData(): Promise<NowData | null> {
  const projects = await getPublishedProjects();
  const project = projects.find((p) => p.featured);
  if (!project) return null;

  const repoFullName = parseGithubRepoFullName(project.repositoryUrl);
  let commits: CommitSummary[] = [];
  if (repoFullName) {
    const cache = await getGithubCache();
    commits = cache.commits.filter((commit) => commit.repoFullName === repoFullName).slice(0, NOW_COMMITS_LIMIT);
  }

  return { project, commits };
}

/** "https://github.com/owner/repo(.git)?(/)?" -> "owner/repo", matching
 * the `repoFullName` shape GitHub's own API (and `github/cache`) uses.
 * Returns null for anything that isn't a github.com repo URL at all
 * (empty field, a GitLab/Bitbucket link, a malformed URL) rather than
 * throwing — a project simply not having commits to show is a normal,
 * expected state here, not an error. */
function parseGithubRepoFullName(repositoryUrl: string | undefined): string | null {
  if (!repositoryUrl) return null;
  let url: URL;
  try {
    url = new URL(repositoryUrl);
  } catch {
    return null;
  }
  if (!/(^|\.)github\.com$/.test(url.hostname)) return null;

  const [owner, repo] = url.pathname
    .replace(/^\/+/, "")
    .replace(/\.git$/, "")
    .replace(/\/+$/, "")
    .split("/");
  if (!owner || !repo) return null;
  return `${owner}/${repo}`;
}
