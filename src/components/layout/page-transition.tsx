"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Lightweight route-change animation — no new dependency (no
 * framer-motion). The trick is just React's own remount behavior: keying
 * the wrapper `div` by `pathname` forces React to tear down and recreate
 * it on every navigation, which replays the CSS `fade-in-up` animation
 * (see tailwind.config.ts) as if it were a fresh mount.
 *
 * Deliberately only an *enter* transition, no exit/cross-fade — doing a
 * real exit animation without a library means manually delaying the
 * unmount (AnimatePresence-style), which adds real complexity for a
 * monochrome/retro site that wants a quick, snappy feel, not a slow
 * cross-fade. `usePathname()` (not `useSearchParams()`) is used
 * deliberately: unlike `useSearchParams`, it doesn't force the page into
 * client-side-only rendering / require a `<Suspense>` boundary, so it's
 * safe to use directly in a layout that still wants static generation.
 *
 * Placed inside each layout (around just the page content, not the
 * persistent chrome around it — navbar/footer, admin sidebar) so those
 * don't flicker/re-animate on every navigation, only the content that
 * actually changed.
 *
 * On the public site, this is the *fallback* enter animation — browsers
 * that support the View Transitions API get the retro "pixel dissolve"
 * effect instead (see `ViewTransitionsProvider` + the `::view-transition-*`
 * rules in globals.css), which already handles both the exit and the
 * enter, so this plain fade is skipped there to avoid the two effects
 * stacking on top of each other. Where View Transitions aren't supported
 * (or the visitor has `prefers-reduced-motion: reduce`, in which case
 * `ViewTransitionsProvider` never engages it), this fade is what the
 * visitor actually sees.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Whether `document.startViewTransition` exists depends on the browser,
  // which the server has no way to know — so the server (and the very
  // first client render, before React has hydrated) always renders the
  // fallback fade's className, exactly like it did before this feature
  // existed. Only *after* mount do we check the real browser capability
  // and flip it off if the pixel-dissolve effect is going to run instead.
  // Computing this directly during render (e.g. `typeof document !==
  // "undefined"`) would make the server and client render different
  // classNames on the very first paint — a hydration mismatch — which is
  // exactly what doing it this way avoids.
  const [skipFallbackFade, setSkipFallbackFade] = React.useState(false);

  React.useEffect(() => {
    setSkipFallbackFade(typeof document.startViewTransition === "function");
  }, []);

  return (
    <div key={pathname} className={skipFallbackFade ? undefined : "motion-safe:animate-fade-in-up"}>
      {children}
    </div>
  );
}
