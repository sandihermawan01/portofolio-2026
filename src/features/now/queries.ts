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
  /** The featured project with the lowest `sortOrder` — the one the
   * carousel and commit list are actually about. */
  activeProject: Project;
  /** Any *other* featured projects, same ordering (lowest `sortOrder`
   * first) minus `activeProject` itself — rendered as a plain list
   * below the active project's card, same idea as the reference
   * layout's further Notice rows below its highlighted top story. Empty
   * when there's only the one featured project, which is the common
   * case and renders fine with nothing extra below the card. */
  otherProjects: Project[];
  /** Empty when the active project has no `repositoryUrl`, the URL isn't
   * a recognizable github.com repo link, or nothing's been synced for it
   * yet — never null, so the page can treat "no commits to show" as one
   * plain empty state regardless of which of those it is. */
  commits: CommitSummary[];
}

/**
 * The "Now" page has no content of its own to maintain anymore — no
 * separate admin form, no Firestore doc to edit. It's entirely derived
 * from whichever published projects are marked Featured / pinned (the
 * existing switch on the Project form). Returns null when nothing is
 * currently featured, so the page can show an honest "belum ada project
 * yang di-pin" empty state instead of silently pretending there's always
 * something in progress.
 *
 * More than one project can be featured at once: `getPublishedProjects()`
 * already sorts featured projects first, by `sortOrder` ascending (ties
 * broken by newest first) — the one with the *lowest* `sortOrder` is
 * `activeProject` (its gallery feeds the carousel, its repo's commits are
 * what's listed), and any further featured projects come back as
 * `otherProjects` in that same order, for the plain list rows underneath.
 */
export async function getNowData(): Promise<NowData | null> {
  const projects = await getPublishedProjects();
  const [activeProject, ...otherProjects] = projects.filter((p) => p.featured);
  if (!activeProject) return null;

  const repoFullName = parseGithubRepoFullName(activeProject.repositoryUrl);
  let commits: CommitSummary[] = [];
  if (repoFullName) {
    const cache = await getGithubCache();
    commits = cache.commits.filter((commit) => commit.repoFullName === repoFullName).slice(0, NOW_COMMITS_LIMIT);
  }

  return { activeProject, otherProjects, commits };
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
