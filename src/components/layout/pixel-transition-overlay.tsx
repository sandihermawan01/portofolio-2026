"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";

/** Chunky, visibly "pixel"-sized squares (not fine confetti/dust) — this
 * is meant to read as retro 8-bit blocks, so bigger tiles actually sell
 * the effect better than a fine grain would. */
const TILE_SIZE_PX = 44;
const TILE_ANIMATION_MS = 200;
const MAX_STAGGER_MS = 260;
const TOTAL_PHASE_MS = TILE_ANIMATION_MS + MAX_STAGGER_MS;

interface Tile {
  delay: number;
  alt: boolean;
}

/**
 * The retro "shatter into pixels" page transition: a full-screen grid of
 * solid square tiles that pop in at random, staggered moments — not a
 * smooth wipe — so it reads as the old page disintegrating into pixel
 * grains, then pop back out the same chunky way once the new page has
 * loaded underneath, revealing it.
 *
 * This replaced an earlier version built on the native View Transitions
 * API (`document.startViewTransition`): that approach could only animate
 * one single snapshot image of the whole page (scale/blur it), which
 * reads as a soft zoom, not literal pixel grains breaking apart — there's
 * no way to get the browser to hand over real per-pixel/per-tile data to
 * slice up. This version doesn't touch the page's actual pixels at all;
 * it's a separate grid of plain `<span>` tiles laid on top that cover and
 * uncover the screen, which is both the only way to get a genuine
 * "shattering into squares" look with no new dependency (no
 * html2canvas/WebGL) and, as a bonus, works identically in every browser
 * — no feature-gating on View Transitions support.
 *
 * Mechanics: a click on any internal link (caught on `document` in the
 * capture phase, so this runs before `next/link`'s own handler, which
 * otherwise calls `preventDefault()` first and would make this a no-op —
 * see the long comment in the removed `view-transitions-provider.tsx` for
 * why capture phase specifically matters here) builds a tile grid sized
 * to the current viewport, plays the "cover" animation, swaps the route
 * via `router.push` once fully covered, waits for the new route to
 * actually commit, then plays the "reveal" animation.
 */
export function PixelTransitionOverlay({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [phase, setPhase] = React.useState<"idle" | "covering" | "covered" | "revealing">("idle");
  const [grid, setGrid] = React.useState<{ cols: number; rows: number; tiles: Tile[] }>({
    cols: 0,
    rows: 0,
    tiles: [],
  });
  const pendingHrefRef = React.useRef<string | null>(null);

  function buildGrid() {
    const cols = Math.ceil(window.innerWidth / TILE_SIZE_PX);
    const rows = Math.ceil(window.innerHeight / TILE_SIZE_PX);
    const tiles: Tile[] = Array.from({ length: cols * rows }, () => ({
      delay: Math.random() * MAX_STAGGER_MS,
      // A handful of tiles in the secondary shade add a bit of static/
      // noise texture instead of one flat solid curtain — both shades are
      // fully opaque, so coverage is never compromised.
      alt: Math.random() < 0.12,
    }));
    setGrid({ cols, rows, tiles });
  }

  // Once the route has actually committed, start revealing.
  React.useEffect(() => {
    if (phase !== "covered" || pendingHrefRef.current !== pathname) return;
    pendingHrefRef.current = null;
    setPhase("revealing");
    const t = window.setTimeout(() => setPhase("idle"), TOTAL_PHASE_MS);
    return () => window.clearTimeout(t);
  }, [pathname, phase]);

  React.useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return; // internal links only
      if (anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (href === pathname) return; // already there

      const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) return;

      event.preventDefault();
      event.stopPropagation();

      buildGrid();
      pendingHrefRef.current = href;
      setPhase("covering");
      window.setTimeout(() => {
        router.push(href);
        setPhase("covered");
      }, TOTAL_PHASE_MS);
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- buildGrid is a plain function, not reactive state
  }, [router, pathname]);

  return (
    <>
      {children}
      {phase !== "idle" && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[200] grid overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, ${TILE_SIZE_PX}px)`,
            gridTemplateRows: `repeat(${grid.rows}, ${TILE_SIZE_PX}px)`,
          }}
        >
          {grid.tiles.map((tile, i) => (
            <span
              key={i}
              style={{ animationDelay: `${tile.delay}ms`, animationDuration: `${TILE_ANIMATION_MS}ms` }}
              className={`${tile.alt ? "bg-muted-foreground" : "bg-foreground"} ${
                phase === "revealing" ? "motion-safe:animate-pixel-tile-out" : "motion-safe:animate-pixel-tile-in"
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}
