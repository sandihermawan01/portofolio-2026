import type { Metadata } from "next";
import { CleanupPanel } from "@/components/admin/cleanup-panel";

export const metadata: Metadata = { title: "Cleanup — Admin" };

export default function AdminCleanupPage() {
  return (
    <div>
      <p className="index-label mb-2">ADMIN / CLEANUP</p>
      <h1 className="font-display text-3xl font-semibold">Bersihkan Data &amp; Gambar</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Cari gambar yang sudah ter-upload ke Cloudinary tapi tidak lagi dipakai di profil atau project manapun, lalu hapus
        biar tidak numpuk kuota penyimpanan.
      </p>

      <div className="mt-8">
        <CleanupPanel />
      </div>
    </div>
  );
}
