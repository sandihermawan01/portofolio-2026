"use client";

import Link from "next/link";
import type { Project } from "@/types/content";
import { formatDateTime } from "@/lib/utils";

/**
 * The pinned-projects list on the "Now" page. Only ONE row is ever open
 * (taller, with its description showing) at a time — the lowest-sortOrder
 * project by default, or whichever row is currently hovered.
 *
 * This is a *controlled* component: `openIndex`/`onHoverChange` live in
 * the parent (`NowPanel`) rather than as local state here, because the
 * carousel on the right needs to react to the same hover, and two
 * separate pieces of state can't stay in sync with each other — one
 * source of truth, read by both. Pure CSS `:hover`/`group-hover` was
 * ruled out earlier for the same underlying reason this needs to be a
 * client component at all: the row that defaults open (sortOrder 0)
 * sits *before* every other row in the DOM, and CSS sibling selectors
 * can only react forward, not backward.
 */
export function NowPinnedList({
  projects,
  openIndex,
  onHoverChange,
}: {
  projects: Project[];
  openIndex: number;
  onHoverChange: (index: number | null) => void;
}) {
  return (
    <ol className="divide-y divide-border border border-border">
      {projects.map((project, index) => {
        const isOpen = index === openIndex;
        return (
          <li key={project.id}>
            <Link
              href={`/project/${project.slug}`}
              onMouseEnter={() => onHoverChange(index)}
              onMouseLeave={() => onHoverChange(null)}
              className={
                isOpen
                  ? "relative flex min-h-[105.5px] flex-col overflow-hidden bg-accent px-4 py-6 transition-all duration-300 ease-out before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:w-full before:bg-foreground before:transition-[width] before:duration-300 before:ease-out"
                  : "relative flex min-h-[51.5px] flex-col overflow-hidden px-4 py-3 transition-all duration-300 ease-out before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:w-0 before:bg-foreground before:transition-[width] before:duration-300 before:ease-out"
              }
            >
              <span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="index-label shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px]">
                    Project
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">{project.title}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {formatDateTime(project.updatedAt)}
                </span>
              </span>
              {project.summary && (
                <span
                  className={
                    isOpen
                      ? "line-clamp-2 mt-2 min-w-0 max-h-16 text-xs text-muted-foreground opacity-100 transition-all duration-300 ease-out"
                      : "line-clamp-2 min-w-0 max-h-0 text-xs text-muted-foreground opacity-0 transition-all duration-300 ease-out"
                  }
                >
                  {project.summary}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
