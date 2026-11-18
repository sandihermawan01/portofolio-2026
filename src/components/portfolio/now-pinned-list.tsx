"use client";

import * as React from "react";
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
  // At any instant, exactly one row is "open" and the rest are "closed",
  // so the list's total height is the same constant whichever row that
  // happens to be — but only once each transition has *settled*.
  // Mid-transition, the growing row and the shrinking row each animate
  // several properties of their own (min-height, padding, margin-top, and
  // the summary's own max-height) on their own clock, and those don't
  // track each other closely enough to cancel out perfectly at every
  // frame — so the list's rendered height would briefly bulge past this
  // constant and snap back, and everything below it (Latest Commits, the
  // footer nav) would visibly bob up and down along with it. Pinning the
  // list to a fixed height makes that bulge invisible: whatever a row
  // does internally mid-transition, the siblings below never move.
  //
  // That fixed height used to be a hand-measured pixel constant
  // (open-row height + closed-row height × count + divider/border
  // widths) — which looked right at the one viewport it was measured at,
  // but was a few sub-pixels short of the real rendered height once line-
  // height rounding, the root `18px` font-size scaling, and actual border
  // widths were all accounted for, and `overflow-hidden` quietly clipped
  // that shortfall off the bottom row instead of showing it. Measuring
  // the list's own natural `scrollHeight` after mount — once, with no
  // height constraint yet applied — sidesteps the guesswork entirely: the
  // locked height is always exactly whatever the browser itself rendered,
  // for whichever row happens to be open at that moment (any one of them
  // is the same total, per the invariant above). Re-measured on resize
  // too, since the row's internal layout (summary stacks under the title
  // on narrow screens, inline beside it on `sm:` and up) changes the
  // natural height across that breakpoint.
  const listRef = React.useRef<HTMLOListElement>(null);
  const [lockedHeight, setLockedHeight] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    function measure() {
      if (!el) return;
      // `scrollHeight` reports the element's full content extent even
      // while `overflow-hidden` + an explicit `height` are already
      // active from a previous measurement, so this is safe to call
      // again on resize without first having to unlock the height.
      setLockedHeight(el.scrollHeight);
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [projects.length]);

  return (
    <ol
      ref={listRef}
      className="divide-y divide-border overflow-hidden border border-border"
      style={lockedHeight !== null ? { height: `${lockedHeight}px` } : undefined}
    >
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
