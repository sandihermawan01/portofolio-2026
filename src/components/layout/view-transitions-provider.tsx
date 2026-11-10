"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Whether (and how) `document.startViewTransition` is typed depends on the
 * installed TypeScript/DOM-lib version, and two different approaches have
 * now each broken the build once:
 * - re-declaring it globally conflicted with a version that already
 *   declares it ("All declarations ... must have identical modifiers").
 * - `interface ... extends Document` conflicted too, because TS checks
 *   that an `extends`'d interface's members stay *structurally compatible*
 *   with Document's own (already-declared, non-optional, differently-typed)
 *   version of the same method — "incorrectly extends interface 'Document'".
 *
 * Going through `unknown` first sidesteps both: it's not a global
 * declaration (nothing to conflict with) and not an `extends` relationship
 * (nothing for TS to structurally check against Document's own typing), so
 * this works the same regardless of what lib.dom.d.ts does or doesn't
 * already declare.
 */
type StartViewTransitionFn = (callback: () => void | Promise<void>) => {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
};

function getStartViewTransition(doc: Document): StartViewTransitionFn | undefined {
  const fn = (doc as unknown as { startViewTransition?: unknown }).startViewTransition;
  return typeof fn === "function" ? (fn.bind(doc) as StartViewTransitionFn) : undefined;
}

/**
 * Wires up the retro "pixel dissolve" page transition (see the
 * `::view-transition-*` rules in globals.css) for every same-page internal
 * `<Link>` click, without touching any of the individual `<Link>` call
 * sites across the site (navbar, footer, project cards, the Previous/Next
 * pager, etc.) — it works by listening for clicks on the whole document
 * and intercepting any plain left-click on an internal `<a href="/...">`.
 *
 * Why interception instead of wrapping `next/link` everywhere: the View
 * Transitions API needs to capture the page's "before" state, then run
 * the actual DOM update *inside* `document.startViewTransition`'s
 * callback, then capture "after" — Next's own `<Link>` click handler has
 * already called `router.push()` by the time our code could otherwise
 * react to it, so there'd be no "before" snapshot left to animate from.
 * Capturing the click first (and calling `preventDefault()`) lets us
 * drive the navigation ourselves, through the same `router.push()`.
 *
 * Registered with `{ capture: true }` — Next's own `<Link>` click handler
 * runs in the bubble phase directly on the `<a>` element and calls
 * `preventDefault()` itself the moment it decides to handle the
 * navigation client-side. A bubble-phase listener on `document` would see
 * that click *after* Link's handler already ran (document is reached last
 * on the way up), by which point `event.defaultPrevented` is already
 * `true` — so this used to just bail out immediately and the view
 * transition never engaged, even though the navigation itself still
 * worked fine via Link's own handling (hence "nothing visibly broke, but
 * no effect either"). Capture phase runs top-down (document first), so
 * this handler now gets first look at the click, before Link's own
 * listener fires — `stopPropagation()` below then stops that bubble-phase
 * handler from also firing and double-navigating.
 *
 * Falls back to an entirely ordinary navigation (this listener just does
 * nothing and lets the click proceed) when:
 * - `document.startViewTransition` isn't supported (e.g. Firefox at the
 *   time of writing) — no partial/broken effect, just a normal nav.
 * - `prefers-reduced-motion: reduce` is set.
 * - the click isn't a plain same-tab left-click on an internal link (new
 *   tab, modifier keys, external URLs, `download` links, `target` !=
 *   `_self`, or a link to the page you're already on).
 */
export function ViewTransitionsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const resolveNavigationRef = React.useRef<(() => void) | null>(null);

  // Once the route actually changes (the new page has committed), resolve
  // whatever view-transition is waiting on it, so the API knows it can
  // capture the "after" snapshot and play the "in" animation.
  React.useEffect(() => {
    if (resolveNavigationRef.current) {
      resolveNavigationRef.current();
      resolveNavigationRef.current = null;
    }
  }, [pathname]);

  React.useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return; // only internal, absolute-path links
      if (anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (href === pathname) return; // already there — nothing to transition

      const startViewTransition = getStartViewTransition(document);
      const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion || !startViewTransition) return;

      event.preventDefault();
      event.stopPropagation();
      startViewTransition(() => {
        return new Promise<void>((resolve) => {
          resolveNavigationRef.current = resolve;
          router.push(href);
        });
      });
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [router, pathname]);

  return <>{children}</>;
}
