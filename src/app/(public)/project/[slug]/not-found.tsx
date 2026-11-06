import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <div className="container-editorial py-24 text-center">
      <p className="index-label mb-4">404</p>
      <h1 className="font-display text-3xl font-semibold">Project tidak ditemukan</h1>
      <p className="mt-2 text-muted-foreground">Project ini tidak ada atau belum dipublikasikan.</p>
      <Link href="/project" className="mt-6 inline-block underline underline-offset-4">
        ← Kembali ke daftar project
      </Link>
    </div>
  );
}
