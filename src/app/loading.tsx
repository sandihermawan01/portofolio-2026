import { LoadingIndicator } from "@/components/ui/loading-indicator";

/**
 * Root-level fallback — only shown when a route segment has no closer
 * `loading.tsx` of its own to use instead (Next.js always picks the
 * nearest one in the tree). `(public)` and `admin/(protected)` both have
 * their own more specific loading screens; this one mainly covers the
 * brief instant between navigating to a route Next.js hasn't prefetched
 * yet and that route's own segment taking over.
 */
export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingIndicator />
    </div>
  );
}
