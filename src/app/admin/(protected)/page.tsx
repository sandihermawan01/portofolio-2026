import Link from "next/link";
import type { Metadata } from "next";
import { getDashboardStats } from "@/features/admin/dashboard";
import { StatCard } from "@/components/admin/stat-card";
import { EmptyState } from "@/components/portfolio/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Overview — Admin" };

export default async function AdminOverviewPage() {
  const stats = await getDashboardStats();
  const hasAnyContent = stats.publishedProjectCount + stats.draftProjectCount + stats.experienceCount > 0;

  return (
    <div>
      <p className="index-label mb-2">ADMIN / OVERVIEW</p>
      <h1 className="font-display text-3xl font-semibold">Dashboard</h1>

      <div className="mt-8">
        {hasAnyContent ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="PROJECT PUBLISHED" value={stats.publishedProjectCount} />
            <StatCard label="PROJECT DRAFT" value={stats.draftProjectCount} />
            <StatCard label="EXPERIENCE" value={stats.experienceCount} />
          </div>
        ) : (
          <EmptyState
            title="Belum ada konten"
            description="Statistik akan muncul di sini setelah Anda menambahkan experience atau project."
          />
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/about">Kelola About</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/experience">Kelola Experience</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/projects">Kelola Project</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/settings">Pengaturan Contact</Link>
        </Button>
      </div>
    </div>
  );
}
