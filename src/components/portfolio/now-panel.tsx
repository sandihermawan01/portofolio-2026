"use client";

import * as React from "react";
import Link from "next/link";
import type { Project } from "@/types/content";
import { NowPinnedList } from "@/components/portfolio/now-pinned-list";
import { NowGalleryCarousel } from "@/components/portfolio/now-gallery-carousel";

/**
 * Owns the one piece of state the left-hand pinned list and the
 * right-hand carousel both need to agree on: which project is currently
 * "open" — the lowest-sortOrder one (`projects[0]`) by default, or
 * whichever row is hovered. That's why the whole two-column layout lives
 * here in one client component instead of being split across the list
 * and the carousel the way it used to be: a column owned by the server
 * page can't hold state shared between two client children.
 *
 * `children` is the one piece of this layout that does NOT react to
 * hover — the "Latest Commits" panel, which stays tied to the fixed
 * active (sortOrder 0) project. It's rendered server-side by the page
 * and passed straight through, sitting below the list in the left
 * column.
 */
export function NowPanel({ projects, children }: { projects: Project[]; children?: React.ReactNode }) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const openIndex = hoveredIndex ?? 0;

  // The page only ever renders `NowPanel` when `getNowData()` found at
  // least one pinned project, so `projects` is never actually empty —
  // but the type checker (noUncheckedIndexedAccess) has no way to know
  // that from an index access alone, hence the explicit guard here
  // instead of a non-null assertion.
  if (projects.length === 0) return null;
  // The guard above rules out `undefined` here at runtime; the `!` is
  // just telling the type checker what that guard already guarantees.
  const openProject = projects[openIndex] ?? projects[0]!;

  const images =
    openProject.gallery.length > 0
      ? openProject.gallery
      : openProject.coverImageUrl
        ? [openProject.coverImageUrl]
        : [];

  return (
    <div className="grid overflow-hidden border-t border-border md:grid-cols-2">
      <div className="flex h-full flex-col justify-between md:border-r md:border-border">
        <NowPinnedList projects={projects} openIndex={openIndex} onHoverChange={setHoveredIndex} />
        {children}
      </div>

      <Link
        href={`/project/${openProject.slug}`}
        className="block h-full transition-[filter] duration-200 hover:brightness-95"
      >
        {/* `key` forces a remount per project so the carousel's own
            auto-advance index resets to 0 and its cross-fade starts
            clean, instead of carrying over a stale index/opacity state
            from whichever project was showing before. */}
        <NowGalleryCarousel key={openProject.id} images={images} alt={openProject.title} />
      </Link>
    </div>
  );
}
