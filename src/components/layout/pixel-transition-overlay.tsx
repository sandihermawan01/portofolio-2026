/**
 * No-op passthrough. This used to intercept internal link clicks and play
 * a page-transition effect (tried: a View Transitions scale/blur, a
 * full-screen pixel-tile curtain, a CRT-style content pinch, a terminal
 * prompt chip, then a glitch-text version of that chip) — every version
 * either distorted the page itself or kept showing an unwanted text
 * overlay, so the feature was removed outright rather than tuned again.
 * Navigation is back to plain, instant `next/link` behavior with nothing
 * extra on top.
 *
 * Kept as a component (rather than deleting the file and its import in
 * `(public)/layout.tsx`) so re-adding an effect later doesn't require
 * touching the layout again — just rewriting this one file.
 */
export function PixelTransitionOverlay({ children }: { children: React.ReactNode }) {
  return children;
}
