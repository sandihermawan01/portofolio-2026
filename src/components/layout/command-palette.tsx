"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommandItem {
  href: string;
  label: string;
  hint?: string;
}

/**
 * Cmd+K / Ctrl+K quick-navigation palette — mounted once (see
 * `(public)/layout.tsx`), fed a flat list of pages + published projects so
 * it never has to fetch anything itself.
 *
 * List entries are plain `<a>` tags, not `next/link`. Closing the palette
 * on selection is trickier than it looks: `PixelTransitionOverlay` listens
 * for anchor clicks on `document` in the *capture* phase and calls
 * `stopPropagation()`, which stops the event from ever reaching this
 * element's own `onClick` handler — so a normal `onClick` here would never
 * fire at all. The first fix attempt (closing on `onMouseDown` instead)
 * created a worse bug: removing the anchor from the DOM between
 * `mousedown` and `mouseup` makes the browser skip firing `click`
 * entirely, so the pixel-transition handler never saw the click either.
 *
 * The actual fix: a `click` listener on `window` itself, in the capture
 * phase — `window` is reached *before* `document` in the capture
 * traversal, so this listener always runs before `PixelTransitionOverlay`'s
 * `stopPropagation()` can block anything. It only *schedules* the close
 * (`setTimeout(..., 0)`) rather than closing immediately, so the anchor
 * stays mounted for the rest of this same click dispatch — letting
 * `PixelTransitionOverlay` read it, `preventDefault()` it, and kick off
 * its own transition — and only unmounts on the next tick. Pressing Enter
 * on a keyboard-selected item calls `.click()` on its anchor, which
 * dispatches a real (if untrusted) click event that this same listener
 * also catches, so keyboard selection closes the palette too.
 */
export function CommandPalette({ items }: { items: CommandItem[] }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const itemRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q) || i.hint?.toLowerCase().includes(q));
  }, [items, query]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Lets a plain button (e.g. the mobile search icon in Navbar) open this
  // without any prop/state wiring between the two components.
  React.useEffect(() => {
    function onOpenRequest() {
      setOpen(true);
    }
    window.addEventListener("open-command-palette", onOpenRequest);
    return () => window.removeEventListener("open-command-palette", onOpenRequest);
  }, []);

  // See the long comment above the component for why this has to live on
  // `window` in the capture phase, and why it defers the actual close.
  React.useEffect(() => {
    if (!open) return;
    function onWindowClickCapture(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest("[data-command-item]");
      if (!target) return;
      window.setTimeout(() => setOpen(false), 0);
    }
    window.addEventListener("click", onWindowClickCapture, { capture: true });
    return () => window.removeEventListener("click", onWindowClickCapture, { capture: true });
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    const t = window.setTimeout(() => inputRef.current?.focus(), 10);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, [open]);

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      itemRefs.current[activeIndex]?.click();
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-[250] flex items-start justify-center bg-foreground/40 px-4 pt-[14vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg border border-border bg-background shadow-[6px_6px_0_0_hsl(var(--foreground))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Ketik untuk cari halaman atau project…"
            className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Cari halaman atau project"
            autoComplete="off"
          />
          <kbd className="index-label hidden shrink-0 sm:inline">ESC</kbd>
        </div>

        <ul className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">Tidak ada hasil.</li>
          )}
          {filtered.map((item, i) => (
            <li key={item.href}>
              <a
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                href={item.href}
                data-command-item
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 text-sm",
                  i === activeIndex ? "bg-accent text-foreground" : "text-foreground/90"
                )}
              >
                <span>{item.label}</span>
                {item.hint && <span className="index-label">{item.hint}</span>}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
