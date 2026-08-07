import { Skeleton } from "@/components/ui/skeleton";

export const TaskSkeleton = () => {
  return (
    <div className="flex border bg-background p-2">
      <div className="min-w-0 flex-1 space-y-2 p-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 shrink-0" />
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-5 w-14" />
        </div>
        <Skeleton className="h-4 w-4/5" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-3.5 shrink-0" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <Skeleton className="m-1 size-8 shrink-0" />
    </div>
  );
};
