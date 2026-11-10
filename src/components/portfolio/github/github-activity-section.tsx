import Link from "next/link";
import { ContributionHeatmap } from "./contribution-heatmap";
import { CountUp } from "./count-up";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/portfolio/empty-state";
import { cn, formatDateTime } from "@/lib/utils";
import { getServerEnv } from "@/config/env";
import type { GithubCache, GithubConfig } from "@/types/github";

const STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  planning: "Direncanakan",
  paused: "Jeda",
  completed: "Selesai",
};

/**
 * The full GitHub Activity section: heatmap + "Currently Developing" repo
 * list + 3 latest commits. Pure Server Component — all data (`config`,
 * `cache`) is fetched by the caller (the page) via
 * src/features/github/queries.ts and passed in, so this component itself
 * does no I/O and stays trivially reusable/testable.
 *
 * Every sub-part has its own empty state: a missing username doesn't hide
 * the repo list, an empty repo list doesn't hide the heatmap, etc. — one
 * piece of unconfigured/stale data never blanks the whole section.
 */
export function GithubActivitySection({ config, cache }: { config: GithubConfig; cache: GithubCache }) {
  const hasAnyError = cache.lastSyncErrors.length > 0;
  const isStale = isCacheStale(cache.lastSyncedAt);

  return (
    <div className="space-y-12">
      {cache.lastSyncedAt && (
        <p className="index-label motion-safe:animate-fade-in flex items-center gap-2">
          {!hasAnyError && !isStale && (
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-foreground motion-safe:animate-pulse-ring" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-foreground" />
            </span>
          )}
          Terakhir disinkronkan: {formatDateTime(cache.lastSyncedAt)}
          {(hasAnyError || isStale) && <span className="text-destructive"> · data mungkin tidak terbaru</span>}
        </p>
      )}

      <section
        aria-labelledby="heatmap-heading"
        className="motion-safe:animate-fade-in-up motion-safe:opacity-0"
        style={{ animationDelay: "0ms" }}
      >
        <h2 id="heatmap-heading" className="font-display text-xl font-medium">
          Contribution Activity
        </h2>
        {cache.contributions ? (
          <div className="mt-4">
            <p className="mb-3 text-sm text-muted-foreground">
              <CountUp value={cache.contributions.totalContributions} /> kontribusi dalam 12 bulan terakhir
            </p>
            <ContributionHeatmap calendar={cache.contributions} />
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              title={config.username ? "Belum ada data kontribusi" : "Belum dikonfigurasi"}
              description={
                config.username
                  ? "Sinkronisasi belum pernah berhasil mengambil data ini."
                  : "Pemilik website belum mengatur username GitHub."
              }
            />
          </div>
        )}
      </section>

      <section
        aria-labelledby="repos-heading"
        className="motion-safe:animate-fade-in-up motion-safe:opacity-0"
        style={{ animationDelay: "100ms" }}
      >
        <h2 id="repos-heading" className="font-display text-xl font-medium">
          Currently Developing
        </h2>
        {cache.repos.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Belum ada repository dipilih" description="Pemilik website belum memilih repository untuk ditampilkan." />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {cache.repos.map((repo, i) => (
              <Link
                key={`${repo.owner}/${repo.repo}`}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ animationDelay: `${150 + i * 60}ms` }}
                className={cn(
                  "group block border border-border p-7",
                  "motion-safe:animate-fade-in-up motion-safe:opacity-0",
                  "transition-all duration-200 ease-out hover:-translate-y-1 hover:border-foreground hover:bg-accent hover:shadow-[4px_4px_0_0_hsl(var(--foreground))]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs text-muted-foreground">
                    {repo.owner}/{repo.name}
                  </p>
                  <Badge variant="outline">{STATUS_LABEL[repo.status] ?? repo.status}</Badge>
                </div>
                {repo.description && <p className="mt-2 text-sm text-muted-foreground">{repo.description}</p>}
                {repo.language && <p className="mt-3 font-mono text-xs text-muted-foreground">{repo.language}</p>}
                {repo.topics.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {repo.topics.slice(0, 6).map((topic) => (
                      <li key={topic}>
                        <Badge variant="outline">{topic}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section
        aria-labelledby="commits-heading"
        className="motion-safe:animate-fade-in-up motion-safe:opacity-0"
        style={{ animationDelay: "200ms" }}
      >
        <h2 id="commits-heading" className="font-display text-xl font-medium">
          Latest Commits
        </h2>
        {cache.commits.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Belum ada commit terbaru" description="Akan tampil setelah sinkronisasi menemukan commit dari repository yang dipilih." />
          </div>
        ) : (
          <ol className="mt-4 divide-y divide-border border border-border font-mono text-sm">
            {cache.commits.map((commit, i) => (
              <li
                key={commit.sha}
                style={{ animationDelay: `${250 + i * 80}ms` }}
                className="motion-safe:animate-fade-in-up motion-safe:opacity-0"
              >
                <Link
                  href={commit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-1 p-4 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="flex min-w-0 items-baseline gap-3">
                    <span className="shrink-0 text-muted-foreground">{commit.shortSha}</span>
                    <span className="truncate text-foreground">{commit.message}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {commit.repoFullName} · {formatDateTime(commit.committedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

/** True once `lastSyncedAt` is older than `GITHUB_SYNC_CACHE_TTL_MINUTES`
 * (default 360 = 6h) — surfaces the "data mungkin tidak terbaru" hint even
 * when the last sync attempt itself reported no errors (e.g. the cron job
 * silently stopped running), rather than only warning on an explicit
 * per-section failure. */
function isCacheStale(lastSyncedAt: string | null): boolean {
  if (!lastSyncedAt) return false;
  const syncedAtMs = new Date(lastSyncedAt).getTime();
  if (Number.isNaN(syncedAtMs)) return false;
  const ttlMs = getServerEnv().GITHUB_SYNC_CACHE_TTL_MINUTES * 60 * 1000;
  return Date.now() - syncedAtMs > ttlMs;
}
