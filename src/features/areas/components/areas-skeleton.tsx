import { Skeleton } from "@/components/ui/skeleton";

export const AreasSkeleton = () => {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex w-full items-center gap-2">
        <Skeleton className="h-10 min-w-0 flex-1" />
        <Skeleton className="size-10 shrink-0" />
      </div>
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <AreaSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export const AreaSkeleton = () => {
  return (
    <div className="flex min-h-64 w-full min-w-0 overflow-hidden border">
      <Skeleton className="w-1/5 shrink-0 rounded-none" />
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
            </div>
          </div>
          <Skeleton className="size-8 shrink-0" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-7" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-7" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-7" />
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="mt-auto flex items-center gap-2">
          <Skeleton className="size-5 shrink-0" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>
    </div>
  );
};
