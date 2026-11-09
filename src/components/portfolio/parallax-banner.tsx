"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Scroll-driven parallax hero banner — no new dependency (no
 * framer-motion/locomotive-scroll). The background layer (either the
 * profile photo, dimmed and grayscaled, or a giant typographic watermark
 * of the title when no photo is set) moves slower than the page scroll,
 * giving the classic parallax depth effect, while the heading text in
 * front scrolls normally.
 *
 * Implementation notes:
 * - Driven by a native `scroll` listener (passive) + `requestAnimationFrame`
 *   throttling, not a continuous rAF loop — it only recomputes on actual
 *   scroll events, so it costs nothing while the page is static.
 * - Respects `prefers-reduced-motion: reduce` by skipping the scroll
 *   listener entirely (not just slowing it down) — the banner still
 *   renders, just without the parallax shift.
 * - `imageUrl` is optional on purpose: a portfolio owner who hasn't
 *   uploaded a photo still gets an intentional-looking banner (the
 *   typographic watermark), never a broken/empty image box — and nothing
 *   here is placeholder/dummy content, both variants render only real
 *   profile data (name, role).
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
  const ref = React.useRef<HTMLDivElement>(null);
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let ticking = false;

    function update() {
      ticking = false;
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      // Only the portion of scroll while the banner is near the viewport
      // matters — rect.top is 0 when the banner's top hits the viewport
      // top, negative once scrolled past. Scaling it down (×0.35) is what
      // makes the background feel like it's moving slower than the page.
      setOffset(rect.top * 0.35);
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative mb-12 h-[34vh] min-h-[240px] max-h-[420px] overflow-hidden border-b border-border bg-muted/30"
    >
      {imageUrl ? (
        <div className="absolute inset-0" style={{ transform: `translateY(${offset}px) scale(1.15)` }} aria-hidden="true">
          <Image src={imageUrl} alt="" fill sizes="100vw" className="object-cover object-top grayscale opacity-25" priority />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{ transform: `translateY(${offset * 0.6}px)` }}
        >
          <span
            className={cn(
              "select-none whitespace-nowrap font-display font-semibold leading-none text-foreground/[0.06]",
              "text-[20vw] sm:text-[16vw]"
            )}
          >
            {title}
          </span>
        </div>
      )}

      <div className="container-editorial relative flex h-full flex-col justify-end pb-8">
        <p className="index-label motion-safe:animate-fade-in">{index}</p>
        <h1 className="motion-safe:animate-fade-in-up font-display text-4xl font-semibold sm:text-6xl">{title}</h1>
        {subtitle && <p className="motion-safe:animate-fade-in-up mt-2 text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
