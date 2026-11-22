"use client";

import * as React from "react";
import { SKILL_LEVELS, SKILL_LEVEL_LABEL, type SkillLevel } from "@/lib/skills";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SkillEntry {
  name: string;
  level: SkillLevel;
}

export function SkillLevelEditor({
  value,
  onChange,
}: {
  value: SkillEntry[];
  onChange: (next: SkillEntry[]) => void;
}) {
  const [name, setName] = React.useState("");
  const [level, setLevel] = React.useState<SkillLevel>("intermediate");

  function addSkill() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onChange([...value, { name: trimmed, level }]);
    setName("");
  }

  function updateLevel(index: number, newLevel: SkillLevel) {
    onChange(value.map((s, i) => (i === index ? { ...s, level: newLevel } : s)));
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
              addSkill();
            }
          }}
          placeholder="Nama tech stack, mis. TypeScript"
          className="flex-1"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as SkillLevel)}
          className="rounded-sm border border-border bg-background px-2 text-sm"
        >
          {SKILL_LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              {SKILL_LEVEL_LABEL[lvl]}
            </option>
          ))}
        </select>
        <Button type="button" onClick={addSkill}>
          Tambah
        </Button>
      </div>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((skill, i) => (
            <li key={`${skill.name}-${i}`} className="flex items-center gap-2 border border-border px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{skill.name}</span>
              <select
                value={skill.level}
                onChange={(e) => updateLevel(i, e.target.value as SkillLevel)}
                className="rounded-sm border border-border bg-background px-2 py-1 text-xs"
              >
                {SKILL_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {SKILL_LEVEL_LABEL[lvl]}
                  </option>
                ))}
              </select>
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
