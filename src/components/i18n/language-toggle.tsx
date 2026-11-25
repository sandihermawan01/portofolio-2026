"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "./translate-root";

/**
 * Shows the language it'll switch TO (the common toggle-button convention),
 * not the one currently active. Styled to match the other icon+label
 * toggles in the navbar (ThemeToggle's "☀ LIGHT" pill), instead of standing
 * out as bare text next to them. `data-no-translate` on the label itself —
 * "ID"/"EN" are language codes, not copy to run through the translator.
 */
export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const next = lang === "id" ? "en" : "id";

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
      className="inline-flex h-10 items-center gap-1.5 border border-border px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Languages className="h-3.5 w-3.5" aria-hidden="true" />
      <span data-no-translate>{next.toUpperCase()}</span>
    </button>
  );
}
