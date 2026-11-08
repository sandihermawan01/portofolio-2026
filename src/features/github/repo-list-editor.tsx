"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DeleteButton } from "@/components/admin/delete-button";
import type { RepoSelection } from "@/types/github";

const STATUS_OPTIONS: { value: RepoSelection["status"]; label: string }[] = [
  { value: "active", label: "Aktif" },
  { value: "planning", label: "Direncanakan" },
  { value: "paused", label: "Jeda" },
  { value: "completed", label: "Selesai" },
];

/**
 * Editor for `githubConfigSchema.selectedRepos` — add/remove/edit the up-to
 * -12 repositories shown in the public "Currently Developing" section.
 *
 * This is local array state only, controlled from GithubConfigForm via
 * react-hook-form's Controller (same pattern as ProjectForm's
 * GalleryEditor/TagInput) — nothing is saved until the surrounding form is
 * submitted. Server-side, `updateGithubConfigAction` re-verifies every
 * entry against the live GitHub API before persisting, so a typo here is
 * caught on save rather than silently accepted.
 *
 * Removing a row uses the same confirm-before-delete `DeleteButton` used
 * elsewhere in the admin, even though the "delete" here is just dropping
 * it from this pending array (nothing is sent to the server until Save) —
 * with up to 12 entries, an accidental misclick losing a hand-curated pick
 * is exactly the kind of slip that component exists to prevent.
 */
export function RepoListEditor({
  value,
  onChange,
}: {
  value: RepoSelection[];
  onChange: (next: RepoSelection[]) => void;
}) {
  const [owner, setOwner] = React.useState("");
  const [repo, setRepo] = React.useState("");

  const atLimit = value.length >= 12;

  function addRepo() {
    const trimmedOwner = owner.trim();
    const trimmedRepo = repo.trim();
    if (!trimmedOwner || !trimmedRepo || atLimit) return;

    const alreadyExists = value.some(
      (r) => r.owner.toLowerCase() === trimmedOwner.toLowerCase() && r.repo.toLowerCase() === trimmedRepo.toLowerCase()
    );
    if (alreadyExists) return;

    onChange([
      ...value,
      { owner: trimmedOwner, repo: trimmedRepo, status: "active", sortOrder: value.length },
    ]);
    setOwner("");
    setRepo("");
  }

  function updateRepo(index: number, patch: Partial<RepoSelection>) {
    onChange(value.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRepo(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada repository dipilih.</p>
      ) : (
        <div className="space-y-3">
          {value.map((r, i) => (
            <div key={`${r.owner}/${r.repo}`} className="grid gap-3 border border-border p-4 sm:grid-cols-[1fr_auto_auto_auto]">
              <div>
                <p className="font-mono text-sm">
                  {r.owner}/{r.repo}
                </p>
              </div>

              <div className="w-full sm:w-40">
                <Label htmlFor={`repo-status-${i}`} className="sr-only">
                  Status
                </Label>
                <Select value={r.status} onValueChange={(v) => updateRepo(i, { status: v as RepoSelection["status"] })}>
                  <SelectTrigger id={`repo-status-${i}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-24">
                <Label htmlFor={`repo-sort-${i}`} className="sr-only">
                  Urutan
                </Label>
                <Input
                  id={`repo-sort-${i}`}
                  type="number"
                  value={r.sortOrder}
                  onChange={(e) => updateRepo(i, { sortOrder: Number(e.target.value) || 0 })}
                  aria-label="Urutan tampilan"
                />
              </div>

              <DeleteButton
                itemLabel={`${r.owner}/${r.repo}`}
                onConfirm={async () => {
                  removeRepo(i);
                  return { ok: true };
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 border border-dashed border-border p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="repo-owner-input">Owner</Label>
          <Input
            id="repo-owner-input"
            placeholder="mis. zsans"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            disabled={atLimit}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="repo-name-input">Repository</Label>
          <Input
            id="repo-name-input"
            placeholder="mis. portfolio"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            disabled={atLimit}
          />
        </div>
        <Button type="button" variant="outline" onClick={addRepo} disabled={atLimit || !owner.trim() || !repo.trim()}>
          Tambah
        </Button>
      </div>
      {atLimit && <p className="text-xs text-muted-foreground">Maksimal 12 repository dipilih.</p>}
      <p className="text-xs text-muted-foreground">
        Repository diverifikasi langsung ke GitHub (harus publik) saat tombol Simpan ditekan.
      </p>
    </div>
  );
}
