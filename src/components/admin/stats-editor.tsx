"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StatEntry {
  label: string;
  value: string;
}

export function StatsEditor({
  value,
  onChange,
}: {
  value: StatEntry[];
  onChange: (next: StatEntry[]) => void;
}) {
  const [label, setLabel] = React.useState("");
  const [val, setVal] = React.useState("");

  function add() {
    if (!label.trim() || !val.trim()) return;
    onChange([...value, { label: label.trim(), value: val.trim() }]);
    setLabel("");
    setVal("");
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Angka, mis. 20+" className="w-28" />
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Label, mis. Project selesai"
          className="flex-1"
        />
        <Button type="button" onClick={add}>
          Tambah
        </Button>
      </div>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((stat, i) => (
            <li key={`${stat.label}-${i}`} className="flex items-center gap-2 border border-border px-3 py-2 text-sm">
              <span className="font-mono text-xs text-muted-foreground">{stat.value}</span>
              <span className="min-w-0 flex-1 truncate">{stat.label}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Hapus ${stat.label}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
