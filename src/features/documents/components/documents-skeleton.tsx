import { Skeleton } from "@/components/ui/skeleton";

export const DocumentsSkeleton = () => {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex items-center gap-2">
        <div className="flex h-10 flex-1 items-center gap-2 border px-2">
          <Skeleton className="size-5 shrink-0" />
          <Skeleton className="h-4 w-full max-w-80" />
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center border">
          <Skeleton className="size-5" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <DocumentSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export const DocumentSkeleton = () => {
  return (
    <div className="flex h-full flex-col overflow-hidden border bg-card shadow-sm">
      <div className="h-80 border-b p-4">
        <div className="h-full space-y-3 overflow-hidden border bg-accent/30 p-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-4/5" />
          <div className="pt-3">
            <Skeleton className="mb-3 h-4 w-1/2" />
            <Skeleton className="mb-2 h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center gap-3 p-4">
        <Skeleton className="size-12 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-4 w-2/5" />
        </div>
        <Skeleton className="size-8 shrink-0" />
      </div>
    </div>
  );
};
