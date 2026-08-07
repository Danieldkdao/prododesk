import { Skeleton } from "@/components/ui/skeleton";
import { TaskSkeleton } from "@/features/tasks/components/task-skeleton";

export const MilestonesSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="flex w-full flex-col gap-4 md:max-w-100">
        <Skeleton className="h-10 w-full" />
        <div className="flex min-h-100 flex-col gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <TaskSkeleton key={index} />
          ))}
        </div>
      </div>
      <div className="h-px w-full bg-border md:h-auto md:w-px" />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 min-w-0 flex-1" />
          <Skeleton className="size-10 shrink-0" />
          <Skeleton className="size-10 shrink-0" />
        </div>
        <div className="flex min-w-0 flex-col">
          {Array.from({ length: 4 }).map((_, index) => (
            <MilestoneSkeleton key={index} isLast={index === 3} />
          ))}
        </div>
      </div>
    </div>
  );
};

export const MilestoneSkeleton = ({ isLast = false }: { isLast?: boolean }) => {
  return (
    <div className="flex w-full min-w-0 gap-3">
      <div className="flex shrink-0 flex-col items-center">
        <Skeleton className="mt-3 size-9" />
        {!isLast && <div className="mt-2 w-px flex-1 bg-border" />}
      </div>
      <div className="min-w-0 flex-1 pb-4">
        <div className="flex items-start border bg-card shadow-sm">
          <div className="py-4.5 pr-1 pl-4">
            <Skeleton className="h-5 w-3" />
          </div>
          <div className="min-w-0 flex-1 py-4 pr-4 pl-1">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="size-4 shrink-0" />
            </div>
            <div className="mt-2 space-y-1.5">
              <Skeleton className="h-4 w-full max-w-120" />
              <Skeleton className="h-4 w-2/3 max-w-80" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <Skeleton className="m-3 size-8 shrink-0" />
        </div>
      </div>
    </div>
  );
};
