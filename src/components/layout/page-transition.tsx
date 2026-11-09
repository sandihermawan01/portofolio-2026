"use client";

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
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="motion-safe:animate-fade-in-up">
      {children}
    </div>
  );
}
