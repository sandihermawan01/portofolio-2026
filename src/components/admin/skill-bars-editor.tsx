"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SkillBarEntry {
  name: string;
  percentage: number;
}

export function SkillBarsEditor({
  value,
  onChange,
}: {
  value: SkillBarEntry[];
  onChange: (next: SkillBarEntry[]) => void;
}) {
  const [name, setName] = React.useState("");
  const [percentage, setPercentage] = React.useState("90");

  function add() {
    const trimmed = name.trim();
    const pct = Math.min(100, Math.max(0, Math.round(Number(percentage))));
    if (!trimmed || Number.isNaN(pct)) return;
    onChange([...value, { name: trimmed, percentage: pct }]);
    setName("");
    setPercentage("90");
  }

  function updatePercentage(index: number, newPercentage: number) {
    const pct = Math.min(100, Math.max(0, Math.round(newPercentage)));
    onChange(value.map((s, i) => (i === index ? { ...s, percentage: pct } : s)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Nama skill, mis. Tea drinking"
          className="flex-1"
        />
        <Input
          type="number"
          min={0}
          max={100}
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="%"
          className="w-20"
        />
        <Button type="button" onClick={add}>
          Tambah
        </Button>
      </div>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((skill, i) => (
            <li key={`${skill.name}-${i}`} className="flex items-center gap-2 border border-border px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{skill.name}</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={skill.percentage}
                onChange={(e) => updatePercentage(i, Number(e.target.value))}
                className="w-16 py-1 text-xs"
              />
              <span className="text-xs text-muted-foreground">%</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Hapus ${skill.name}`}
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
