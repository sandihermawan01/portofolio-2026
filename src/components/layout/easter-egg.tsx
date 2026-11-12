"use client";

import * as React from "react";

const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

/**
 * Classic Konami code easter egg — mounted once (see `(public)/layout.tsx`).
 * No persistence, no analytics, just a brief retro "achievement unlocked"
 * overlay that self-dismisses. `progressRef` tracks how far through the
 * sequence the visitor currently is; a wrong key resets it (unless that
 * wrong key happens to also be a valid restart of the sequence, i.e.
 * pressing Up again after a mistake shouldn't force a full restart from a
 * second Up).
 */
export function EasterEgg() {
  const [visible, setVisible] = React.useState(false);
  const progressRef = React.useRef(0);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Letter keys compare lowercase; arrow keys are already consistent.
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const expected = KONAMI_SEQUENCE[progressRef.current];

      if (key === expected) {
        progressRef.current += 1;
        if (progressRef.current === KONAMI_SEQUENCE.length) {
          progressRef.current = 0;
          setVisible(true);
        }
      } else {
        progressRef.current = key === KONAMI_SEQUENCE[0] ? 1 : 0;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => setVisible(false), 2600);
    return () => window.clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="motion-safe:animate-fade-in pointer-events-none fixed inset-0 z-[300] flex items-center justify-center bg-background/90 backdrop-blur-sm"
    >
      <div className="motion-safe:animate-scale-in border border-border bg-background px-8 py-6 text-center shadow-[6px_6px_0_0_hsl(var(--foreground))]">
        <p className="index-label mb-2">ACHIEVEMENT UNLOCKED</p>
        <p className="font-display text-2xl font-semibold tracking-wide">↑ ↑ ↓ ↓ ← → ← → B A</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">Kamu nemu easter egg-nya. 🎮</p>
      </div>
    </div>
  );
}
