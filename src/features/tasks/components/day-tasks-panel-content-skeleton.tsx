import { Skeleton } from "@/components/ui/skeleton";

export const DayTasksPanelContentSkeleton = () => {
  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 px-2">
        <Skeleton className="h-7 w-48 rounded-md" />
        <Skeleton className="size-8 rounded-md" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
        <div className="flex w-full items-center gap-2">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="size-9 shrink-0 rounded-md" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <TaskLoadingSkeleton key={index} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

const TaskLoadingSkeleton = ({ index }: { index: number }) => {
  return (
    <div className="flex items-start gap-2 border-b py-3">
      <Skeleton className="mt-0.5 size-4 shrink-0 rounded-sm" />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2">
            <Skeleton
              className="h-5 rounded-md"
              style={{
                width: `${Math.max(35, 65 - index * 6)}%`,
              }}
            />
            <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
          </div>

          <Skeleton className="size-5 shrink-0 rounded-md" />
        </div>

        <Skeleton className="h-4 w-4/5 rounded-md" />

        {index % 2 === 0 && <Skeleton className="h-4 w-28 rounded-md" />}
      </div>
    </div>
  );
};
