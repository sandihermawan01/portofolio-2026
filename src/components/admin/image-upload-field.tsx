"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED = "image/png,image/jpeg,image/webp,image/avif";

/**
 * Generic image upload field. The actual upload server action (project
 * cover/gallery vs. avatar) is injected so this component stays reusable;
 * every call still goes through `requireAdmin()` + MIME/size/magic-byte
 * validation server-side (see lib/media/cloudinary-upload.ts) — client-side
 * checks here are only for a faster, friendlier error message.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  uploadAction,
}: {
  label: string;
  value: string | undefined;
  onChange: (url: string | undefined) => void;
  uploadAction: (formData: FormData) => Promise<{ ok: boolean; error?: string; data?: { url: string } }>;
}) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Ukuran file harus di bawah 5MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadAction(formData);
      if (!result.ok || !result.data) {
        toast.error(result.error ?? "Upload gagal.");
        return;
      }
      onChange(result.data.url);
      toast.success("Gambar berhasil diunggah.");
    } catch {
      toast.error("Terjadi kesalahan saat mengunggah.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-sm border border-border">
            <Image src={value} alt="" fill sizes="80px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-sm border border-dashed border-border text-muted-foreground">
            <Upload className="h-5 w-5" />
          </div>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {value ? "Ganti" : "Unggah"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>
              <X className="h-4 w-4" /> Hapus
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">PNG, JPEG, WebP, atau AVIF. Maksimal 5MB.</p>
    </div>
  );
}
