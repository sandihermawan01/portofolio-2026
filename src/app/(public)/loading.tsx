import { Skeleton } from "@/components/ui/skeleton";

export default function PublicLoading() {
  return (
    <div className="container-editorial py-16">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-6 h-5 w-full max-w-md" />
      <Skeleton className="mt-2 h-5 w-full max-w-sm" />
    </div>
  );
}
