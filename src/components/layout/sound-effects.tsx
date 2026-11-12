"use client";

import * as React from "react";
import { playBlip } from "@/lib/ui-sound";

/** Same set of elements that get the `.brutalist-hover` interaction, plus
 * plain links/buttons that don't — so a nav link or the hamburger menu
 * still gets a blip even though it isn't a "brutalist" card. */
const INTERACTIVE_SELECTOR = "a, button, [role='button'], .brutalist-hover";

/**
 * Mounted once (see `(public)/layout.tsx`). Delegates hover/click
 * listening to `document` instead of attaching a handler to every
 * interactive element individually — this is the only way to cover
 * elements across the whole site (including ones added later) from one
 * place. Does nothing at all while sound is muted (the default) — see
 * `playBlip`'s own guard in `lib/ui-sound.ts`.
 */
export function SoundEffects() {
  React.useEffect(() => {
    let lastHovered: Element | null = null;

    function onPointerOver(e: PointerEvent) {
      if (e.pointerType !== "mouse") return; // skip touch taps — those get a click blip only
      const target = (e.target as HTMLElement | null)?.closest(INTERACTIVE_SELECTOR);
      if (!target || target === lastHovered) return;
      lastHovered = target;
      playBlip(1100, 16, "square");
    }

    function onPointerOut(e: PointerEvent) {
      const stillInsideInteractive = (e.relatedTarget as HTMLElement | null)?.closest?.(INTERACTIVE_SELECTOR);
      if (!stillInsideInteractive) lastHovered = null;
    }

    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest(INTERACTIVE_SELECTOR);
      if (!target) return;
      playBlip(620, 45, "square");
    }

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
