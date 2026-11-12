"use client";

import * as React from "react";
import { Tv } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "crt";

/**
 * Toggles `data-crt="on"` on `<html>` — the actual scanline overlay CSS
 * lives in globals.css (`.crt-overlay`, rendered once in the root layout
 * and shown/hidden purely by that attribute selector) so this component is
 * just the button + persistence, mirroring ThemeToggle's split between
 * "CSS already knows how" and "this just flips the switch".
 */
export function CrtToggle() {
  const [on, setOn] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "on") {
        setOn(true);
        document.documentElement.setAttribute("data-crt", "on");
      }
    } catch {
      // No saved preference available — stays off, same as a fresh visit.
    }
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    document.documentElement.setAttribute("data-crt", next ? "on" : "off");
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      // Not remembered next time, but the toggle itself still worked.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={on ? "Matikan efek CRT" : "Aktifkan efek CRT"}
      aria-pressed={on}
      title="Efek scanline CRT (percobaan)"
      className={cn("brutalist-hover inline-flex h-10 w-10 items-center justify-center", on && "bg-accent")}
    >
      <Tv className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
