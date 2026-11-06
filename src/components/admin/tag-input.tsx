"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/**
 * Simple comma/Enter-separated tag editor for string[] fields (skills,
 * technologies). Kept deliberately simple — no drag-reorder, no autocomplete
 * — since the master prompt favors avoiding over-engineering for a feature
 * this small.
 */
export function TagInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  ariaLabel: string;
}) {
  const [draft, setDraft] = React.useState("");

  function commitDraft() {
    const trimmed = draft.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-sm border border-input p-2">
        {value.map((tag, i) => (
          <Badge key={`${tag}-${i}`} variant="outline" className="gap-1 normal-case">
            {tag}
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Hapus ${tag}`}
              className="rounded-sm hover:text-destructive focus-visible:outline-none"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          aria-label={ariaLabel}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={value.length === 0 ? placeholder : undefined}
          className="min-w-[8ch] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Tekan Enter atau koma untuk menambah.</p>
    </div>
  );
}

// Re-export Input in case a page wants the plain input styling elsewhere.
export { Input };
