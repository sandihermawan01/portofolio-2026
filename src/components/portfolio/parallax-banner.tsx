"use client";

import * as React from "react";
import Image from "next/image";

/**
 * Multi-layer parallax banner for /about. On a mouse-equipped device the
 * layers follow the cursor; on a touch device (no cursor to follow) they
 * instead drift as the page is scrolled — see `useParallax` below for how
 * that's detected and blended into the same `{x, y}` values every layer
 * reads from.
 *
 * Design: an "editorial blueprint" scene — print-design motifs (crop marks,
 * a compass/crosshair ring, a dot grid, a giant ghosted index numeral)
 * layered behind the real heading text, plus a pinned photo/monogram
 * card in front. Every layer carries its own parallax "depth": elements
 * meant to read as closer to the viewer (the photo card, the scattered
 * "+" marks) shift the most; elements meant to read as further away (the
 * dot grid) barely move at all. The heading text itself moves the least of
 * all, so it stays legible and the depth illusion reads as happening
 * *behind* it.
 *
 * No new dependency: it's `<svg>`/CSS layers positioned with plain inline
 * `transform: translate3d(...)`, throttled to one state update per
 * animation frame, the same pattern already used by the home page's graph
 * hero.
 *
 * Content is real: `index`/`title`/`subtitle` are the same props the page
 * already passes in (title/subtitle come straight from the profile), the
 * giant ghost numeral reuses the real `index` text instead of inventing
 * one, and the photo card falls back to the owner's own initials (derived
 * from `title`) rather than a placeholder image when no photo is set.
 */
export function ParallaxBanner({
  index,
  title,
  subtitle,
  imageUrl,
}: {
  index: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { x, y } = useParallax(containerRef);
  const indexNumeral = index.split("/")[0]?.trim() || index;
  const initials = getInitials(title);

  return (
    <div
      ref={containerRef}
      className="relative mb-12 h-[44vh] min-h-[300px] max-h-[480px] overflow-hidden border-b border-border bg-muted/10"
    >
      {/* Decorative scene — everything in here is aria-hidden; the real
          content (heading) is rendered separately below, un-rotated and
          with the smallest parallax delta, so it never gets hard to read. */}
      <div aria-hidden="true" className="absolute inset-0">
        {/* Dot grid — furthest layer, barely moves. */}
        <div
          className="absolute inset-[-10%] opacity-[0.12] transition-transform duration-700 ease-out motion-reduce:!transform-none"
          style={{
            transform: translate(x, y, 3),
            backgroundImage: "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        {/* Compass / crosshair ring — a classic print & cartography motif,
            echoing the site's editorial "index" framing device. */}
        <svg
          viewBox="0 0 400 400"
          fill="none"
          className="absolute -right-32 top-1/2 h-[150%] w-auto -translate-y-1/2 text-foreground/[0.08] transition-transform duration-500 ease-out motion-reduce:!transform-none sm:-right-16"
          style={{ transform: `translateY(-50%) ${translate(x, y, 9)}` }}
        >
          <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="1" />
          <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="1" />
          <line x1="200" y1="14" x2="200" y2="386" stroke="currentColor" strokeWidth="1" />
          <line x1="14" y1="200" x2="386" y2="200" stroke="currentColor" strokeWidth="1" />
        </svg>

        {/* Giant ghosted index numeral — reuses the page's own "01" index
            text, not invented content. */}
        <p
          className="absolute -bottom-10 right-2 select-none font-display text-[32vw] font-bold leading-none text-foreground/[0.05] transition-transform duration-500 ease-out motion-reduce:!transform-none sm:text-[20vw]"
          style={{ transform: translate(x, y, 7) }}
        >
          {indexNumeral}
        </p>

        {/* Crop marks — the four print-industry corner brackets, a nod to
            "laying out a page" that fits the editorial theme. */}
        {CROP_CORNERS.map((corner) => (
          <CropMark
            key={corner.position}
            className={`absolute h-7 w-7 text-foreground/25 transition-transform duration-300 ease-out motion-reduce:!transform-none ${corner.className}`}
            style={{ transform: `${corner.rotate} ${translate(x, y, 12)}` }}
          />
        ))}

        {/* Scattered "+" marks at varying depths — the same glyph used for
            the experience accordion toggle, reused here as a connective
            motif rather than a random decoration. */}
        {PLUS_MARKS.map((mark, i) => (
          <span
            key={i}
            style={{ top: mark.top, left: mark.left, transform: translate(x, y, mark.factor) }}
            className="absolute select-none font-mono text-foreground/20 transition-transform duration-200 ease-out motion-reduce:!transform-none"
          >
            +
          </span>
        ))}

        {/* Pinned photo / monogram card — the nearest layer, moves the
            most. Falls back to initials (real data, derived from `title`)
            rather than a placeholder image when there's no photo yet.
            Anchored to the top-right corner (not the bottom), since the
            heading text is anchored to the bottom of the banner — keeping
            the two in separate zones avoids them overlapping on short
            banners/small screens. */}
        <div
          style={{ transform: `${translate(x, y, 20)} rotate(-4deg)` }}
          className="absolute right-6 top-6 h-20 w-20 overflow-hidden border border-border bg-card shadow-[6px_6px_0_0_hsl(var(--foreground))] transition-transform duration-150 ease-out motion-reduce:!transform-none sm:right-10 sm:top-10 sm:h-32 sm:w-32"
        >
          {imageUrl ? (
            <Image src={imageUrl} alt="" fill sizes="128px" className="object-cover grayscale" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-2xl font-semibold text-foreground/70">
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* Real content — smallest parallax delta of all, so the scene reads
          as depth happening behind the text rather than the text itself
          swimming around. */}
      <div
        className="container-editorial pointer-events-none relative flex h-full flex-col justify-end pb-8 transition-transform duration-300 ease-out motion-reduce:!transform-none"
        style={{ transform: translate(x, y, 2) }}
      >
        <p className="index-label motion-safe:animate-fade-in">{index}</p>
        <h1 className="motion-safe:animate-fade-in-up font-display text-4xl font-semibold sm:text-6xl">{title}</h1>
        {subtitle && <p className="motion-safe:animate-fade-in-up mt-2 text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

/** Builds a `translate3d(...)` CSS string from normalized cursor position
 * (`x`/`y` in [-1, 1]) and this layer's depth `factor` (px of travel at
 * full cursor displacement). Kept as a plain string builder (not a
 * `transform` object merge) so call sites can still append their own
 * `rotate(...)`/`translateY(...)` after it. */
function translate(x: number, y: number, factor: number): string {
  return `translate3d(${(x * factor).toFixed(2)}px, ${(y * factor).toFixed(2)}px, 0)`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

const PLUS_MARKS: { top: string; left: string; factor: number }[] = [
  { top: "16%", left: "10%", factor: 16 },
  { top: "72%", left: "16%", factor: 24 },
  { top: "22%", left: "82%", factor: 13 },
  { top: "58%", left: "90%", factor: 27 },
  { top: "86%", left: "55%", factor: 18 },
];

const CROP_CORNERS: { position: string; className: string; rotate: string }[] = [
  { position: "tl", className: "left-4 top-4", rotate: "rotate(0deg)" },
  { position: "tr", className: "right-4 top-4", rotate: "rotate(90deg)" },
  { position: "br", className: "bottom-4 right-4", rotate: "rotate(180deg)" },
  { position: "bl", className: "bottom-4 left-4", rotate: "rotate(270deg)" },
];

function CropMark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M2 10V2H10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Drives the parallax layers from whichever input actually makes sense for
 * the device: a mouse-equipped desktop gets the cursor-following behavior
 * (tracked across the whole window, not just this banner, so the scene
 * feels ambient rather than only reacting inside a small hit-box); a touch
 * device — which has no cursor to speak of — gets a scroll-driven version
 * instead, so the layers drift at different depths as the banner scrolls
 * through the viewport, the same way the original scroll-parallax
 * implementation worked.
 *
 * The device check is `(hover: hover) and (pointer: fine)`, the standard
 * media-feature pair for "has a mouse-like pointer", not a screen-width
 * breakpoint — a touch laptop or a desktop with only a trackpad on a
 * narrow window still gets whichever behavior actually matches its input,
 * rather than guessing from viewport size.
 *
 * Both branches normalize to the same [-1, 1] `{x, y}` shape (scroll mode
 * only ever varies `y`) so every layer's `translate(x, y, factor)` call
 * stays identical regardless of which mode is active, and both are
 * throttled to one state update per animation frame. Entirely inert under
 * `prefers-reduced-motion: reduce` — no listener of either kind is
 * attached, so the scene just renders at rest.
 */
function useParallax(containerRef: React.RefObject<HTMLDivElement | null>): { x: number; y: number } {
  const [pos, setPos] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Checked two ways, not just one media query: a touch-capable device
    // (`ontouchstart`/`maxTouchPoints`) or a coarse primary pointer both
    // mean "no cursor to follow, use scroll instead" — some mobile
    // browsers only report one of the two reliably, and a touch laptop
    // should get scroll-mode too even though it also has a mouse.
    const isTouchCapable = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const hasCoarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const isFinePointer = !isTouchCapable && !hasCoarsePointer;
    let ticking = false;

    function schedule(compute: () => { x: number; y: number }) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        setPos(compute());
      });
    }

    // Desktop: cursor position, tracked across the whole window.
    if (isFinePointer) {
      let latest = { x: 0, y: 0 };

      function onMouseMove(e: MouseEvent) {
        latest = {
          x: (e.clientX / window.innerWidth) * 2 - 1,
          y: (e.clientY / window.innerHeight) * 2 - 1,
        };
        schedule(() => latest);
      }

      function onMouseLeave() {
        latest = { x: 0, y: 0 };
        schedule(() => latest);
      }

      window.addEventListener("mousemove", onMouseMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onMouseLeave);
      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      };
    }

    // Touch/mobile: how far the banner has scrolled through the viewport.
    // 0 while its center is level with the viewport's center, ranging up
    // to ±1 as it approaches entering/leaving from the bottom/top edge.
    function computeScrollOffset(): { x: number; y: number } {
      const el = containerRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const elCenter = rect.top + rect.height / 2;
      const raw = (elCenter - vh / 2) / (vh / 2 + rect.height / 2);
      return { x: 0, y: Math.max(-1, Math.min(1, raw)) };
    }

    function onScrollOrResize() {
      schedule(computeScrollOffset);
    }

    setPos(computeScrollOffset());
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [containerRef]);

  return pos;
}
