"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { syncGithubActivityAction } from "@/features/github/actions";
import type { GithubCache } from "@/types/github";

/**
 * Shows when the GitHub cache was last synced, any per-section errors from
 * that last attempt, and a manual "Sync Now" button wired to
 * `syncGithubActivityAction` — for right after changing the repo list, or
 * whenever the admin wants fresher data without waiting for the next
 * scheduled cron run (see src/app/api/github/sync/route.ts).
 */
export function SyncStatusCard({ cache, githubConfigured }: { cache: GithubCache; githubConfigured: boolean }) {
  const router = useRouter();
  const [syncing, setSyncing] = React.useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const result = await syncGithubActivityAction();
      if (!result.ok) {
        toast.error(result.error ?? "Sinkronisasi gagal.");
        return;
      }
      if (result.error) {
        toast.warning(`Sinkronisasi selesai dengan sebagian error: ${result.error}`);
      } else {
        toast.success("Sinkronisasi berhasil.");
      }
      router.refresh();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Status Sinkronisasi</CardTitle>
        <CardDescription>
          Data di-cache di Firestore dan di-refresh otomatis setiap beberapa jam (lihat README untuk setup cron), atau
          dipicu manual di sini.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!githubConfigured && (
          <p className="text-sm text-destructive">
            GITHUB_TOKEN belum diset di server — sinkronisasi tidak dapat berjalan sampai environment variable ini
            dikonfigurasi.
          </p>
        )}

        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Terakhir disinkronkan</dt>
            <dd>{cache.lastSyncedAt ? formatDateTime(cache.lastSyncedAt) : "Belum pernah"}</dd>
          </div>
        </dl>

        {cache.lastSyncErrors.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium text-destructive">
              <Badge variant="outline">Error terakhir</Badge>
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-destructive">
              {cache.lastSyncErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <Button type="button" onClick={handleSync} disabled={syncing || !githubConfigured}>
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Sync Now
        </Button>
      </CardContent>
    </Card>
  );
}
