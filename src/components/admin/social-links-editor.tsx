"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SocialLink } from "@/lib/validations/common";

let counter = 0;
function newId() {
  counter += 1;
  return `new-${Date.now()}-${counter}`;
}

export function SocialLinksEditor({
  value,
  onChange,
}: {
  value: SocialLink[];
  onChange: (next: SocialLink[]) => void;
}) {
  function update(index: number, patch: Partial<SocialLink>) {
    onChange(value.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...value, { id: newId(), label: "", url: "" }]);
  }

  return (
    <div className="space-y-3">
      {value.map((link, i) => (
        <div key={link.id} className="flex flex-col gap-2 border border-border p-3 sm:flex-row sm:items-center">
          <Input
            aria-label="Label tautan"
            placeholder="Label (mis. GitHub)"
            value={link.label}
            onChange={(e) => update(i, { label: e.target.value })}
            className="sm:w-40"
          />
          <Input
            aria-label="URL tautan"
            placeholder="https://..."
            value={link.url}
            onChange={(e) => update(i, { url: e.target.value })}
            className="flex-1"
          />
          <Button type="button" variant="ghost" size="icon" aria-label="Hapus tautan" onClick={() => remove(i)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4" /> Tambah tautan
      </Button>
    </div>
  );
}
