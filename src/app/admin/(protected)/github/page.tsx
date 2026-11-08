import type { Metadata } from "next";
import { getGithubConfig, getGithubCache } from "@/features/github/queries";
import { GithubConfigForm } from "@/features/github/github-config-form";
import { SyncStatusCard } from "@/features/github/sync-status-card";
import { isGithubIntegrationConfigured } from "@/config/env";

export const metadata: Metadata = { title: "GitHub Activity — Admin" };

export default async function AdminGithubPage() {
  const [config, cache] = await Promise.all([getGithubConfig(), getGithubCache()]);

  return (
    <div className="space-y-10">
      <div>
        <p className="index-label mb-2">ADMIN / GITHUB ACTIVITY</p>
        <h1 className="mb-2 font-display text-3xl font-semibold">GitHub Activity</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Atur username GitHub, repository yang ditampilkan sebagai &quot;Currently Developing&quot;, dan visibilitas
          halaman publik /github.
        </p>
      </div>

      <GithubConfigForm initialData={config} />

      <SyncStatusCard cache={cache} githubConfigured={isGithubIntegrationConfigured()} />
    </div>
  );
}
