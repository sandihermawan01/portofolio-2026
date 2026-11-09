import { Skeleton } from "@/components/ui/skeleton";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

export default function PublicLoading() {
  return (
    <div className="container-editorial py-16">
      <LoadingIndicator className="mb-8" />
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-6 h-5 w-full max-w-md" />
      <Skeleton className="mt-2 h-5 w-full max-w-sm" />
    </div>
  );
}
