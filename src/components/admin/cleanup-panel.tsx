"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  getUnusedImagesAction,
  deleteUnusedImagesAction,
  cleanupLegacyProfileFieldsAction,
} from "@/features/cleanup/actions";
import { Button } from "@/components/ui/button";
import type { UnusedImage } from "@/features/cleanup/queries";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function CleanupPanel() {
  const [images, setImages] = React.useState<UnusedImage[] | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [cleaningFields, setCleaningFields] = React.useState(false);

  const scan = React.useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    const result = await getUnusedImagesAction();
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error ?? "Gagal memeriksa gambar.");
      setImages([]);
      return;
    }
    setImages(result.data ?? []);
  }, []);

  React.useEffect(() => {
    void scan();
  }, [scan]);

  function toggle(url: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  function toggleAll() {
    if (!images) return;
    setSelected((prev) => (prev.size === images.length ? new Set() : new Set(images.map((img) => img.url))));
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return;
    if (!window.confirm(`Hapus ${selected.size} gambar terpilih secara permanen? Ini tidak bisa dibatalkan.`)) return;

    setDeleting(true);
    const urls = Array.from(selected);
    const result = await deleteUnusedImagesAction(urls);
    setDeleting(false);

    if (!result.ok) {
      toast.error(result.error ?? "Gagal menghapus gambar.");
      return;
    }
    toast.success(`${urls.length} gambar berhasil dihapus.`);
    setImages((prev) => (prev ? prev.filter((img) => !selected.has(img.url)) : prev));
    setSelected(new Set());
  }

  async function handleCleanupFields() {
    setCleaningFields(true);
    const result = await cleanupLegacyProfileFieldsAction();
    setCleaningFields(false);
    if (!result.ok) {
      toast.error(result.error ?? "Gagal membersihkan data.");
      return;
    }
    toast.success("Field lama (fun facts) berhasil dibersihkan dari dokumen profil.");
  }

  return (
    <div className="space-y-10">
      <section className="space-y-3 border border-border p-4">
        <h2 className="index-label">GAMBAR TIDAK TERPAKAI</h2>
        <p className="text-xs text-muted-foreground">
          Gambar yang sudah ter-upload ke Cloudinary tapi tidak lagi dipakai sebagai foto profil atau cover/gallery project manapun.
        </p>

        {loading && <p className="text-sm text-muted-foreground">Memeriksa…</p>}

        {!loading && images && images.length === 0 && (
          <p className="text-sm text-muted-foreground">Semua gambar yang ter-upload masih terpakai. 🎉</p>
        )}

        {!loading && images && images.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
              <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
                {selected.size === images.length ? "Batal pilih semua" : "Pilih semua"}
              </Button>
              <Button type="button" size="sm" disabled={selected.size === 0 || deleting} onClick={handleDeleteSelected}>
                {deleting ? "Menghapus…" : `Hapus yang dipilih (${selected.size})`}
              </Button>
              <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={() => void scan()} disabled={loading}>
                Scan ulang
              </Button>
            </div>

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img) => (
                <li key={img.url}>
                  <label className="group flex cursor-pointer flex-col gap-2">
                    <div className="relative aspect-square overflow-hidden rounded-sm border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="h-full w-full object-cover grayscale" />
                      <input
                        type="checkbox"
                        checked={selected.has(img.url)}
                        onChange={() => toggle(img.url)}
                        className="absolute left-2 top-2 h-4 w-4 accent-foreground"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p className="truncate font-mono">{img.publicId}</p>
                      <p>
                        {img.folder} · {formatBytes(img.bytes)} · {formatDate(img.createdAt)}
                      </p>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="space-y-3 border border-border p-4">
        <h2 className="index-label">DATA LAMA DI PROFIL</h2>
        <p className="text-xs text-muted-foreground">
          Fitur &quot;fun facts&quot; sudah diganti &quot;My Skills&quot;, tapi field lamanya bisa saja masih nyangkut di dokumen profil
          Firestore. Sudah otomatis diabaikan saat ditampilkan, tapi bisa dibersihkan biar dokumennya rapi.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={handleCleanupFields} disabled={cleaningFields}>
          {cleaningFields ? "Membersihkan…" : "Bersihkan field lama"}
        </Button>
      </section>
    </div>
  );
}
