"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Thin progress bar fixed to the top of the viewport, shown briefly on
 * every route change — the classic "page is loading" cue (à la NProgress/
 * YouTube), done with no new dependency.
 *
 * This is deliberately a DECORATIVE/simulated progress, not a real one:
 * the App Router doesn't expose a "navigation started"/"navigation
 * finished" event pair to hook into from a Client Component, so instead
 * this just plays a fixed, fast step sequence every time `pathname`
 * changes (which fires as soon as a navigation is committed). For this
 * site's actual data-fetching delay, the real signal is each route
 * segment's own `loading.tsx` Suspense fallback — this bar is purely the
 * top-of-screen motion cue that makes a navigation *feel* instant,
 * layered on top of that.
 *
 * `usePathname()` only (not `useSearchParams()`) — see page-transition.tsx
 * for why: avoids forcing a Suspense boundary / client-side-only
 * rendering requirement onto whatever layout renders this.
 */
export function RouteProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    // Skip the very first mount — there's no "previous page" to transition
    // from, so showing the bar on initial load would be meaningless noise.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timers: number[] = [];
    setVisible(true);
    setProgress(25);
    timers.push(window.setTimeout(() => setProgress(65), 90));
    timers.push(window.setTimeout(() => setProgress(90), 240));
    timers.push(window.setTimeout(() => setProgress(100), 360));
    timers.push(
      window.setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 560)
    );

    return () => timers.forEach(clearTimeout);
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] motion-reduce:hidden"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 250ms ease" }}
    >
      <div className="h-full bg-foreground" style={{ width: `${progress}%`, transition: "width 220ms ease-out" }} />
    </div>
  );
}
