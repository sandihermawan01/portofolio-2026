"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";

type StartViewTransitionFn = (callback: () => Promise<void> | void) => void;

/** Browsers only wait a short, UA-defined time for the update callback
 * passed to `startViewTransition` to settle before aborting the whole
 * transition with a "DOM update timed out" error (Chrome's limit is
 * around 4s). In Next.js dev mode specifically, navigating to a route
 * that hasn't been compiled yet triggers an on-demand webpack compile
 * that can easily take longer than that — so this component settles the
 * callback itself well before the browser's own limit, rather than
 * risking that hard abort. Worst case on a slow navigation: the
 * transition finishes slightly before the new page has fully painted,
 * which just looks like an ordinary instant nav for that one click —
 * still far better than an uncaught TimeoutError. */
const VIEW_TRANSITION_SAFETY_MS = 2500;

/** Whether `document.startViewTransition` is typed at all depends on the
 * installed TypeScript/DOM-lib version — casting through `unknown` first
 * (rather than relying on the ambient type, or redeclaring it ourselves)
 * is what's worked reliably across versions for this project so far; see
 * the matching comment in the (now unused, kept only for reference)
 * `ViewTransitionsProvider`. */
function getStartViewTransition(doc: Document): StartViewTransitionFn | undefined {
  const fn = (doc as unknown as { startViewTransition?: unknown }).startViewTransition;
  return typeof fn === "function" ? (fn.bind(doc) as StartViewTransitionFn) : undefined;
}

/**
 * Page transition, take 2: instead of a synthetic grid of colored tiles
 * sitting on top of the page while the real navigation happens underneath,
 * this uses the browser's native View Transitions API
 * (`document.startViewTransition`), which takes real rasterized snapshots
 * of the old page and the new page and exposes them as the
 * `::view-transition-old(root)` / `::view-transition-new(root)`
 * pseudo-elements. The wavy, upward-sweeping reveal shape from the tile
 * version is kept — it's just a moving `clip-path` on the new snapshot now
 * (see the `page-wave-reveal` keyframes in `globals.css`) instead of a grid
 * of `<div>`s, so what's animating in is literally the destination page's
 * own pixels.
 *
 * Click interception is unchanged from the tile version: a `window`-level
 * **capture-phase** click listener (window fires before document in the
 * capture phase, so this reliably runs before any other capture-phase
 * listener further down the tree — e.g. the command palette's own close
 * handler — regardless of what unmounts in between) that intercepts plain
 * left-clicks on same-tab internal links, calls `preventDefault()` +
 * `stopPropagation()`, and drives the navigation itself.
 *
 * The part that's genuinely new is coordinating `router.push` (which
 * updates the DOM asynchronously, via a React re-render some time later)
 * with `startViewTransition`'s update callback (which the API expects to
 * resolve once the DOM is in its final "new page" state, so it knows when
 * it's safe to snapshot it). `resolveNavRef` bridges the two: the update
 * callback stashes its `resolve` there and calls `router.push`; a
 * `useEffect` watching `pathname` notices once the route has actually
 * committed and calls that `resolve` — after one extra double-rAF so the
 * new page has actually painted, not just mounted, before it's captured.
 */
export function PixelTransitionOverlay({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const pendingHrefRef = React.useRef<string | null>(null);
  const resolveNavRef = React.useRef<(() => void) | null>(null);

  // Once the route has actually committed to the href we navigated to,
  // let the pending view transition know it can snapshot the new page.
  //
  // IMPORTANT: this used to wait one extra `requestAnimationFrame` here
  // before resolving, on the assumption that the just-committed frame
  // might not have painted yet. That assumption was backwards: while a
  // view transition's update callback is still pending, the browser
  // deliberately *suspends* rendering updates (precisely so it can swap
  // in the "new" snapshot without a flash of unstyled/half-painted
  // content) — so no new frame is ever rendered for rAF to fire for
  // until this callback resolves. Waiting on rAF here was a deadlock:
  // it could never fire, so every single navigation silently fell all
  // the way through to the safety-timeout fallback below instead of
  // resolving as soon as the route actually changed. Resolving
  // synchronously, right when `pathname` matches, is correct — the DOM
  // for the new route is already committed by the time this effect runs.
  React.useEffect(() => {
    if (pendingHrefRef.current !== pathname || !resolveNavRef.current) return;
    pendingHrefRef.current = null;
    const resolve = resolveNavRef.current;
    resolveNavRef.current = null;
    resolve();
  }, [pathname]);

  // Always clear any still-pending transition on unmount, so a navigation
  // that was mid-flight when the component happened to unmount (shouldn't
  // normally happen — this lives at the root — but costs nothing to guard)
  // can't leave a dangling ref around.
  React.useEffect(() => {
    return () => {
      resolveNavRef.current = null;
      pendingHrefRef.current = null;
    };
  }, []);

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

      // Browser doesn't support the API (e.g. Firefox at the time of
      // writing) — let the click through as an ordinary navigation
      // instead of silently doing nothing.
      const startViewTransition = getStartViewTransition(document);
      if (!startViewTransition) return;

      event.preventDefault();
      event.stopPropagation();

      pendingHrefRef.current = href;
      startViewTransition(() => {
        return new Promise<void>((resolve) => {
          let settled = false;
          const settleOnce = () => {
            if (settled) return;
            settled = true;
            // Only clear the refs if they still point at *this* settle —
            // a later click may already have overwritten them with its
            // own pending navigation by the time this fallback timeout
            // fires, and clearing those would wrongly cancel that one.
            if (resolveNavRef.current === settleOnce) resolveNavRef.current = null;
            if (pendingHrefRef.current === href) pendingHrefRef.current = null;
            resolve();
          };

          resolveNavRef.current = settleOnce;
          router.push(href);
          window.setTimeout(settleOnce, VIEW_TRANSITION_SAFETY_MS);
        });
      });
    }

    window.addEventListener("click", onClick, { capture: true });
    return () => window.removeEventListener("click", onClick, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router is stable; pathname only gates the href check
  }, [router, pathname]);

  return <>{children}</>;
}
