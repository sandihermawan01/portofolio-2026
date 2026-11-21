"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";

interface ViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
}
type StartViewTransitionFn = (callback: () => Promise<void> | void) => ViewTransition;

const VIEW_TRANSITION_SAFETY_MS = 2500;
function getStartViewTransition(doc: Document): StartViewTransitionFn | undefined {
  const fn = (doc as unknown as { startViewTransition?: unknown }).startViewTransition;
  return typeof fn === "function" ? (fn.bind(doc) as StartViewTransitionFn) : undefined;
}

export function PixelTransitionOverlay({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const pendingHrefRef = React.useRef<string | null>(null);
  const resolveNavRef = React.useRef<(() => void) | null>(null);

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
      const transition = startViewTransition(() => {
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

      // The browser can abort a transition on its own (e.g. viewport
      // resize mid-flight, common on mobile from the keyboard or address
      // bar) — the navigation already happened via router.push either
      // way, so just swallow the rejection instead of letting it surface
      // as an unhandled error.
      transition.ready.catch(() => {});
      transition.finished.catch(() => {});
    }

    window.addEventListener("click", onClick, { capture: true });
    return () => window.removeEventListener("click", onClick, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router is stable; pathname only gates the href check
  }, [router, pathname]);

  return <>{children}</>;
}
