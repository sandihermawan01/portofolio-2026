import { Skeleton } from "@/components/ui/skeleton";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

/**
 * Previously missing — admin pages had no `loading.tsx`, so navigating
 * between them showed nothing until the new page's server data finished
 * fetching (no perceived feedback at all). This fills that gap; the
 * surrounding sidebar/layout in `admin/(protected)/layout.tsx` keeps
 * rendering immediately, only this content area shows the skeleton.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <LoadingIndicator label="MEMUAT" />
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
