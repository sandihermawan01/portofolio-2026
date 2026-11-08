"use client";

import * as React from "react";

/**
 * Animates a number counting up from 0 to `value` on mount — used for the
 * "N kontribusi dalam 12 bulan terakhir" figure above the heatmap. Small,
 * dependency-free (no animation library), and respects
 * `prefers-reduced-motion`: it just renders the final value immediately
 * for anyone with that preference, rather than skip the check and animate
 * regardless.
 *
 * `requestAnimationFrame`-driven rather than `setInterval`, so the count
 * stays smooth regardless of the actual total (a huge total doesn't tick
 * one-by-one — the step size scales with elapsed time, not with `value`).
 */
export function CountUp({ value, durationMs = 900 }: { value: number; durationMs?: number }) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || value <= 0) {
      setDisplay(value);
      return;
    }

    let frame: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      // ease-out cubic — fast start, settles gently into the final number.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return <span>{display.toLocaleString("id-ID")}</span>;
}
