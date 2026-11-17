import type { Metadata } from "next";
import { EmptyState } from "@/components/portfolio/empty-state";
import { NowPanel } from "@/components/portfolio/now-panel";
import { getNowData } from "@/features/now/queries";
import { formatDateTime } from "@/lib/utils";
import type { Project } from "@/types/content";

/** How many pinned-project rows the left list shows at most, and how many
 * of the active project's latest commits the compact panel below it
 * shows — both kept small on purpose so this column doesn't grow
 * unbounded as more projects get pinned. The carousel on the right
 * doesn't need to match this column's height precisely itself — it's
 * `h-full` and stretches to whichever side ends up taller, via the grid
 * row's default stretch behaviour — but keeping this side reasonably
 * compact still keeps the page looking tidy. */
const MAX_PINNED_PROJECTS_SHOWN = 3;
const MAX_COMMITS_SHOWN = 2;

export const metadata: Metadata = {
  title: "What I Do",
  description: "Apa yang sedang dikerjakan sekarang.",
};

export const revalidate = 0;

/**
 * Redesigned per the "Now" brief: no tabs (the reference layout's
 * Latest/Notice/News/Event filter row is dropped entirely — this page
 * only ever shows one thing), and no content of its own to edit in admin
 * anymore. Everything's derived from whichever project(s) are marked
 * Featured/pinned (see `getNowData`).
 *
 * `NowPanel` owns the two-column layout (pinned list + carousel) and the
 * hover state they share: hovering a row both opens it (taller,
 * description showing) and swaps the carousel to that project's
 * screenshots, falling back to the lowest-sortOrder project when
 * nothing's hovered. "Latest Commits" is the one piece that does NOT
 * follow that hover — it's rendered here, server-side, and passed into
 * `NowPanel` as `children` so it always stays tied to the fixed active
 * project.
 */
export default async function NowPage() {
  const now = await getNowData();
  const allProjects: Project[] = now ? [now.activeProject, ...now.otherProjects] : [];
  const pinnedProjects = allProjects.slice(0, MAX_PINNED_PROJECTS_SHOWN);

  return (
    <div className="container-editorial py-16">
      <p className="index-label mb-2">02 / WHAT I DO</p>
      <h1 className="mb-10 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Now</h1>

      {!now ? (
        <EmptyState
          title="Belum ada project yang di-pin"
          description='Tandai salah satu project sebagai "Featured / pinned" dari dashboard admin untuk menampilkannya di sini.'
        />
      ) : (
        <NowPanel projects={pinnedProjects}>
          {/* Fills the space the 3-row cap on the list above leaves
              behind, and keeps this always tied to the active (lowest
              sortOrder) project rather than whichever row is hovered —
              it isn't part of the hover-driven list/carousel at all.
              Same edge-to-edge width as the pinned list above it (no
              extra horizontal inset), just a border-t to separate the
              two. */}
          <div className="border-t border-border pb-6 pt-6 md:pb-0">
            <p className="index-label mb-3 px-4">Latest Commits</p>
            {now.commits.length === 0 ? (
              <p className="px-4 text-sm text-muted-foreground">Belum ada commit terbaru untuk project ini.</p>
            ) : (
              <ol className="divide-y divide-border border border-border font-mono text-xs">
                {now.commits.slice(0, MAX_COMMITS_SHOWN).map((commit) => (
                  <li
                    key={commit.sha}
                    className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="flex min-w-0 items-baseline gap-3">
                      <span className="shrink-0 text-muted-foreground">{commit.shortSha}</span>
                      <span className="truncate text-foreground">{commit.message}</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">{formatDateTime(commit.committedAt)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </NowPanel>
      )}
    </div>
  );
}
