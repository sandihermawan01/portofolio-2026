import Link from "next/link";
import type { Metadata } from "next";
import { getDashboardStats } from "@/features/admin/dashboard";
import { getGithubConfig, getGithubCache } from "@/features/github/queries";
import { StatCard } from "@/components/admin/stat-card";
import { EmptyState } from "@/components/portfolio/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview — Admin" };

export default async function AdminOverviewPage() {
  const [stats, githubConfig, githubCache] = await Promise.all([getDashboardStats(), getGithubConfig(), getGithubCache()]);
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
          <Link href="/admin/now">Kelola Now</Link>
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

      {/* Short summary only, not a full stat grid — the full detail (repo
          list, sync errors, manual sync button) lives at /admin/github. */}
      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <Badge variant={githubConfig.widgetVisible ? "solid" : "outline"}>
          GitHub Activity: {githubConfig.widgetVisible ? "Aktif" : "Nonaktif"}
        </Badge>
        <p className="text-sm text-muted-foreground">
          {githubConfig.selectedRepos.length} repository dipilih
          {githubCache.lastSyncedAt ? ` · sync terakhir ${formatDateTime(githubCache.lastSyncedAt)}` : " · belum pernah sync"}
        </p>
        <Button asChild variant="link" size="sm" className="ml-auto">
          <Link href="/admin/github">Kelola GitHub Activity →</Link>
        </Button>
      </div>
    </div>
  );
}
