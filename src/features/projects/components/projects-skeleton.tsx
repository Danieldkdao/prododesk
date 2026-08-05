import { Skeleton } from "@/components/ui/skeleton";

export const ProjectsSkeleton = () => {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex w-full items-center gap-2">
        <Skeleton className="h-10 min-w-0 flex-1" />
        <Skeleton className="size-10 shrink-0" />
      </div>
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <ProjectSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export const ProjectSkeleton = () => {
  const statWidths = ["w-16", "w-20", "w-24", "w-20"];

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 border border-l-4 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="size-10 shrink-0" />
            <Skeleton className="h-7 w-1/2 min-w-28" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        </div>
        <Skeleton className="size-8 shrink-0" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {statWidths.map((width, index) => (
          <div key={index} className="flex items-center gap-2">
            <Skeleton className="size-5 shrink-0" />
            <Skeleton className={`h-5 ${width}`} />
          </div>
        ))}
      </div>
    </div>
  );
};
