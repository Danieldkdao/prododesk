import { Skeleton } from "@/components/ui/skeleton";
import { TaskSkeleton } from "@/features/tasks/components/task-skeleton";

export const MilestonesSkeleton = () => {
  return (
    <div className="flex w-full flex-col gap-2 lg:flex-row lg:gap-4">
      <div className="flex w-full min-w-0 flex-col gap-4 lg:h-[calc(100dvh-12rem)] lg:max-w-100">
        <Skeleton className="hidden h-10 w-full lg:block" />
        <div className="w-full min-w-0 overflow-hidden lg:hidden">
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex w-72 shrink-0 items-center border bg-background p-2"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2 p-2">
                  <Skeleton className="size-5 shrink-0" />
                  <Skeleton className="size-5 shrink-0" />
                  <Skeleton className="h-6 min-w-0 flex-1" />
                </div>
                <Skeleton className="m-1 size-8 shrink-0" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden min-h-0 flex-1 flex-col gap-2 overflow-hidden lg:flex">
          {Array.from({ length: 4 }).map((_, index) => (
            <TaskSkeleton key={index} />
          ))}
        </div>
      </div>
      <div className="h-px w-full shrink-0 bg-border lg:h-auto lg:w-px" />
      <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
        <div className="flex w-full min-w-0 items-center gap-2">
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
    <div className="flex w-full min-w-0 gap-2 sm:gap-3">
      <div className="flex shrink-0 flex-col items-center">
        <Skeleton className="mt-3 size-9" />
        {!isLast && <div className="mt-2 w-px flex-1 bg-border" />}
      </div>
      <div className="min-w-0 flex-1 pb-4">
        <div className="flex min-w-0 items-start border bg-card shadow-sm">
          <div className="py-4.5 pr-1 pl-2 sm:pl-4">
            <Skeleton className="h-5 w-3" />
          </div>
          <div className="min-w-0 flex-1 py-4 pr-2 pl-1 sm:pr-4">
            <div className="flex min-w-0 items-center gap-2">
              <Skeleton className="h-6 min-w-0 flex-1 max-w-44" />
              <Skeleton className="size-4 shrink-0" />
            </div>
            <div className="mt-2 space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-5 w-28 sm:w-32" />
            </div>
          </div>
          <Skeleton className="m-2 size-8 shrink-0 sm:m-3" />
        </div>
      </div>
    </div>
  );
};
