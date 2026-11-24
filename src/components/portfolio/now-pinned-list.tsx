"use client";

import * as React from "react";
import Link from "next/link";
import type { Project } from "@/types/content";
import { formatDateTime } from "@/lib/utils";

const DURATION_MS = 500;

// The two settled states every row interpolates between. `minHeight`/
// `paddingY` are what actually change this list's rendered height;
// everything else (summary reveal, accent bar) is layout-neutral and
// just rides along with the same fraction for visual consistency.
const CLOSED = { minHeight: 51.5, paddingY: 12, marginTop: 0, summaryMaxHeight: 0 };
const OPEN = { minHeight: 105.5, paddingY: 24, marginTop: 8, summaryMaxHeight: 64 };

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * The pinned-projects list on the "Now" page. Only ONE row is ever open
 * (taller, with its description showing) at a time — the lowest-sortOrder
 * project by default, or whichever row is currently hovered.
 *
 * This is a *controlled* component: `openIndex`/`onHoverChange` live in
 * the parent (`NowPanel`) rather than as local state here, because the
 * carousel on the right needs to react to the same hover, and two
 * separate pieces of state can't stay in sync with each other — one
 * source of truth, read by both.
 *
 * Every row's height is driven by a single continuous "how open" fraction
 * (0 = closed, 1 = open) per row, animated with `requestAnimationFrame`,
 * instead of letting Tailwind/CSS run two *independent* transitions —
 * one row growing, one shrinking — that are each eased on their own
 * clock and only *expected* to cancel out exactly. They never quite did:
 * the growing row's content (padding, margin, the summary's own reveal)
 * could outpace or lag the shrinking row's by a few px at any given
 * instant, so the list's *actual* rendered height would briefly bulge
 * past its settled total — and since that total is what everything below
 * it (Latest Commits, the footer, this list's own last row) is sized or
 * clipped against, that bulge is exactly what pushed the last row's
 * content down far enough to get cut off mid-transition.
 *
 * Deriving every row's style from one shared fraction each frame fixes
 * this *by construction*, not by hoping two curves line up: the
 * fractions are computed as `lerp(from[i], target[i], easedT)` for every
 * row `i` using the exact same `easedT` — and since both `from` and
 * `target` always sum to exactly 1 (exactly one row is ever fully open),
 * linearity guarantees the interpolated sum is 1 at *every* instant, not
 * just at the two ends. That holds even if the user changes their hover
 * target again before a transition finishes — the next transition just
 * starts from wherever the fractions currently are, which still sum to 1.
 *
 * The list's own height is still reserved via a fixed-height, absolutely
 * positioned `<ol>` inside a plain wrapper `<div>` (see `reservedHeight`
 * below) so that siblings below never move even if this invariant were
 * ever violated by a future change — belt and suspenders — and the last
 * row's own accent bar still lives outside that clipped box entirely
 * (see the comment near the bottom), since it's a real sibling element,
 * not a row-local one, regardless of how that row's height is animated.
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
  const lastIndex = projects.length - 1;

  const fractionsRef = React.useRef<number[]>(projects.map((_, i) => (i === openIndex ? 1 : 0)));
  const fromRef = React.useRef<number[]>(fractionsRef.current.slice());
  const rafRef = React.useRef<number | null>(null);
  const startRef = React.useRef(0);
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  React.useEffect(() => {
    // Pinned-project count changing while mounted shouldn't normally
    // happen, but re-sync rather than risk indexing past the array.
    if (fractionsRef.current.length !== projects.length) {
      fractionsRef.current = projects.map((_, i) => (i === openIndex ? 1 : 0));
    }

    const target = projects.map((_, i) => (i === openIndex ? 1 : 0));
    fromRef.current = fractionsRef.current.slice();
    startRef.current = performance.now();
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    function tick(now: number) {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / DURATION_MS);
      const eased = easeOutCubic(t);
      fractionsRef.current = fromRef.current.map((start, i) => lerp(start, target[i] ?? 0, eased));
      bump();
      rafRef.current = t < 1 ? requestAnimationFrame(tick) : null;
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only openIndex/projects.length should (re)start a transition
  }, [openIndex, projects.length]);

  const listRef = React.useRef<HTMLOListElement>(null);
  const [reservedHeight, setReservedHeight] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    function measure() {
      if (!el) return;
      setReservedHeight(el.scrollHeight);
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [projects.length]);

  const lastFraction = fractionsRef.current[lastIndex] ?? 0;

  return (
    <div className="relative">
      <div
        className="relative overflow-hidden"
        style={reservedHeight !== null ? { height: `${reservedHeight}px` } : undefined}
      >
        <ol ref={listRef} className="absolute inset-x-0 top-0 divide-y divide-border border border-border">
          {projects.map((project, index) => {
            const f = fractionsRef.current[index] ?? 0;
            const isLast = index === lastIndex;

            return (
              <li key={project.id}>
                <Link
                  href={`/project/${project.slug}`}
                  onMouseEnter={() => onHoverChange(index)}
                  onMouseLeave={() => onHoverChange(null)}
                  // `height` here, not `minHeight` — `min-height` is only
                  // a *floor*, so once the summary's own `maxHeight`
                  // below grows past that text's real two-line height
                  // (a few lines of lorem ipsum land well under the 64px
                  // ceiling), the row's actual rendered height stops
                  // tracking `f` at all and just sits at whatever the
                  // now-fully-revealed content needs — breaking the
                  // "always sums to the same total" guarantee this whole
                  // approach depends on, for exactly the stretch of the
                  // transition where the content is almost (but not
                  // quite) fully revealed. An explicit `height`, combined
                  // with Tailwind preflight's global `box-sizing:
                  // border-box` and this element's own `overflow-hidden`,
                  // fixes the box at exactly this number no matter what
                  // the content inside wants to be — so the sum really is
                  // exact at every instant, not just approximately so
                  // outside one narrow content-dependent range.
                  style={{
                    height: `${lerp(CLOSED.minHeight, OPEN.minHeight, f)}px`,
                    paddingTop: `${lerp(CLOSED.paddingY, OPEN.paddingY, f)}px`,
                    paddingBottom: `${lerp(CLOSED.paddingY, OPEN.paddingY, f)}px`,
                  }}
                >
                  {/* The highlight background as its own layer (not a
                      `bg-accent` class toggle) so it fades continuously
                      with the same `f` instead of snapping in/out at
                      some arbitrary threshold — painted first, so the
                      normal-flow content below paints over it. */}
                  <span aria-hidden="true" className="absolute inset-0 bg-accent" style={{ opacity: f }} />

                  <span className="relative flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
                      className="relative line-clamp-2 min-w-0 text-xs text-muted-foreground"
                      style={{
                        marginTop: `${lerp(CLOSED.marginTop, OPEN.marginTop, f)}px`,
                        maxHeight: `${lerp(CLOSED.summaryMaxHeight, OPEN.summaryMaxHeight, f)}px`,
                        opacity: f,
                      }}
                    >
                      {project.summary}
                    </span>
                  )}
                  {/* Every row but the last gets its accent bar right
                      here — there's nothing below any of them for a
                      clipped sliver to be a problem. The last row's
                      lives outside the clipped box below instead. */}
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-[2px] bg-foreground"
                      style={{ width: `${f * 100}%`, opacity: f }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      {/* The last row's accent bar, as a plain sibling element instead
          of living inside the clipped box above. Since exactly one row
          is open at a time and the fractions always sum to 1, the
          *bottom* of the whole list is always at `reservedHeight` from
          this outer div's top, whichever row happens to be open — so
          this bar can be pinned to that one constant position (not
          something measured per-row) and it'll always line up with the
          last row's own bottom edge, without ever being a descendant of
          the ancestor that clips it. */}
      {reservedHeight !== null && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 h-[2px] bg-foreground"
          style={{ top: `${reservedHeight - 2}px`, width: `${lastFraction * 100}%`, opacity: lastFraction }}
        />
      )}
    </div>
  );
}
