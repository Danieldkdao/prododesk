import { Skeleton } from "@/components/ui/skeleton";

export const ProjectsSkeleton = () => {
  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <ProjectSkeleton key={index} />
      ))}
    </div>
  );
};

export const ProjectSkeleton = () => {
  return (
    <div className="flex min-w-0 flex-col gap-5 border border-t-4 p-5">
      <div className="flex min-w-0 items-start gap-4">
        <Skeleton className="size-10 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-7 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Skeleton className="size-5" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <Skeleton className="size-8 shrink-0" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20 shrink-0" />
        <Skeleton className="h-2 flex-1" />
        <Skeleton className="h-4 w-20 shrink-0" />
      </div>
      <div className="-mx-5 border-t" />
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <Skeleton className="size-5 shrink-0" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-32 shrink-0" />
      </div>
    </div>
  );
};
