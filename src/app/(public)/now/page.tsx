import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { EmptyState } from "@/components/portfolio/empty-state";
import { NowGalleryCarousel } from "@/components/portfolio/now-gallery-carousel";
import { getNowData } from "@/features/now/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "What I Do",
  description: "Apa yang sedang dikerjakan sekarang.",
};

export const revalidate = 0;

/**
 * Redesigned per the "Now" brief: no tabs (the reference layout's
 * Latest/Notice/News/Event filter row is dropped entirely — this page
 * only ever shows one thing), and no content of its own to edit in
 * admin anymore. The whole card is derived from whichever project is
 * marked Featured/pinned (see `getNowData`) and is a single link
 * through to that project's own page — there's nothing else to click
 * inside it (the commit rows are plain text, not individually linked to
 * GitHub, specifically so the whole card can be one clickable block
 * without nesting an `<a>` inside another one).
 */
export default async function NowPage() {
  const now = await getNowData();

  return (
    <div className="container-editorial py-16">
      <SectionHeading index="02 / WHAT I DO" title="What I Do" lead="Apa yang lagi saya kerjakan sekarang." />

      {!now ? (
        <EmptyState
          title="Belum ada project yang di-pin"
          description='Tandai salah satu project sebagai "Featured / pinned" dari dashboard admin untuk menampilkannya di sini.'
        />
      ) : (
        <Link
          href={`/project/${now.project.slug}`}
          className="group grid overflow-hidden border border-border transition-all duration-200 ease-out hover:border-foreground hover:shadow-[6px_6px_0_0_hsl(var(--foreground))] md:grid-cols-2"
        >
          <div className="flex flex-col justify-between gap-8 p-8">
            <div>
              {/* The "underline" accent from the reference layout, kept
                  monochrome instead of the reference's gold. */}
              <p className="font-display text-2xl font-semibold tracking-tight">Now</p>
              <span className="mt-3 block h-[3px] w-16 bg-foreground" aria-hidden="true" />
              <p className="mt-5 text-sm text-muted-foreground">
                Lagi ngerjain <span className="font-medium text-foreground">{now.project.title}</span> —{" "}
                {now.project.summary}
              </p>
            </div>

            <div>
              <p className="index-label mb-3">Latest Commits</p>
              {now.commits.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada commit terbaru untuk project ini.</p>
              ) : (
                <ol className="divide-y divide-border border border-border font-mono text-xs">
                  {now.commits.map((commit) => (
                    <li key={commit.sha} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between">
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
          </div>

          <NowGalleryCarousel
            images={
              now.project.gallery.length > 0
                ? now.project.gallery
                : now.project.coverImageUrl
                  ? [now.project.coverImageUrl]
                  : []
            }
            alt={now.project.title}
          />
        </Link>
      )}
    </div>
  );
}
