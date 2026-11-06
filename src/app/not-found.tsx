import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="index-label mb-4">404</p>
      <h1 className="font-display text-3xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="mt-3 text-muted-foreground">Halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
      <Link href="/" className="mt-6 text-sm underline underline-offset-4">
        Kembali ke beranda
      </Link>
    </div>
  );
}
