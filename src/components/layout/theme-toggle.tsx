"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

/**
 * Applies a theme by setting `data-theme` on `<html>` — the CSS that
 * actually switches colors already exists in globals.css
 * (`:root[data-theme="dark"]` for an explicit choice, plus
 * `@media (prefers-color-scheme: dark)` as the fallback when no explicit
 * choice has been made) and needed no changes for this feature; this
 * component is just the UI + persistence on top of it. Saved to
 * `localStorage` so the choice survives a reload/revisit; wrapped in
 * try/catch since `localStorage` can throw in a private window or with
 * site data blocked — theme switching still works for the current page
 * view either way, it just won't be remembered next time.
 */
function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    window.localStorage.setItem("theme", theme);
  } catch {
    // Not remembered this time, but the toggle itself still worked.
  }
}

/**
 * Light/dark toggle, styled to match the rest of the site's "monochrome
 * retro" look rather than a plain generic icon button:
 * - The same hard-edged brutalist shadow + press-down interaction used
 *   on cards elsewhere (shadow offsets to the corner, then collapses to
 *   flush on `:active`, like a physical button being pushed in).
 * - A monospace "LIGHT"/"DARK" label, not just an icon — this site leans
 *   on text labels (index labels, section headers) more than iconography.
 * - On click, the icon does a chunky retro "flip" (`animate-theme-flip`
 *   in tailwind.config.ts) using `steps(7, end)` timing instead of a
 *   smooth rotation, so it reads as a flipping placard/sign rather than
 *   a modern spinning-icon transition — consistent with the `steps()`
 *   timing already used elsewhere (the page-transition effect, the
 *   experience accordion's icon rotation doesn't use this, but the retro
 *   page-dissolve does). Replayed on every click via remounting the icon
 *   wrapper with a changing `key` — the same trick `PageTransition` uses
 *   to replay its own CSS animation on every navigation.
 *
 * Starts in an unresolved `null` state and only resolves the icon/label
 * after mount (see the comment above the `useEffect`) to avoid a
 * server/client hydration mismatch, the same pattern `PageTransition`
 * uses for its own browser-only check.
 */
export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme | null>(null);
  const [flipKey, setFlipKey] = React.useState(0);

  // The server has no way to know the visitor's stored theme preference,
  // so the very first client render deliberately matches the server's
  // "undecided" placeholder below. Right after mount, this reads whatever
  // `<html data-theme>` actually ended up as — already resolved by the
  // blocking inline script in the root layout before this component ever
  // ran — and reflects that in the icon/label.
  React.useEffect(() => {
    const resolved = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    setTheme(resolved);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    setFlipKey((k) => k + 1);
  }

  const label = theme === "dark" ? "LIGHT" : "DARK";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      className={cn(
        "brutalist-hover group inline-flex h-10 items-center gap-2 px-3",
        "font-mono text-xs font-medium uppercase tracking-wider text-foreground"
      )}
    >
      <span key={flipKey} className="motion-safe:animate-theme-flip inline-flex" aria-hidden="true">
        {theme === null ? (
          <span className="block h-4 w-4" /> // placeholder: same size, no icon yet, until mounted
        ) : theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </span>
      <span className="hidden sm:inline">{theme === null ? "" : label}</span>
    </button>
  );
}
