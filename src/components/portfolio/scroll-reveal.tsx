"use client";

import * as React from "react";

/**
 * Wraps a section so it fades/slides into view the first time it crosses
 * into the viewport, instead of just sitting there fully-rendered the
 * whole time. Before this, the sections below the hero either had no
 * animation at all, or used `animate-fade-in-up`, which only plays once
 * on initial mount — anything below the fold had already finished
 * "animating" long before a visitor actually scrolled down to see it. A
 * plain IntersectionObserver toggles one bit of state; the motion itself
 * is CSS transition classes (not a keyframe animation), so it can ease in
 * from wherever the element already sits instead of replaying a fixed
 * offset every time.
 *
 * Reveals once and stays revealed (`unobserve` after the first intersect)
 * — this is a "the page is alive" cue for a first pass down the page, not
 * a repeating scroll gimmick that would fight someone scrolling back up
 * past something they've already seen.
 */
export function ScrollReveal({
  children,
  className,
  delayMs = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  as?: "div" | "section";
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Comp = Tag as React.ElementType;

  return (
    <Comp
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:!transition-none motion-reduce:!transform-none motion-reduce:!opacity-100 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className ?? ""}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Comp>
  );
}
