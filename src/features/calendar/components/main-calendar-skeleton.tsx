import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const MainCalendarSkeleton = ({
  fixedHeight = false,
  fullScreen = false,
}: {
  fixedHeight?: boolean;
  fullScreen?: boolean;
}) => {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden",
        !fullScreen && "gap-2",
      )}
    >
      <div
        className={cn(
          "flex w-full shrink-0 items-center justify-between gap-2 py-1",
          fullScreen && "border-x border-t px-2",
        )}
      >
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 shrink-0 rounded-md" />
          {fullScreen && <Skeleton className="h-6 w-px shrink-0" />}
          <Skeleton className="h-9 w-40 rounded-md" />
          {fullScreen && <Skeleton className="h-6 w-px shrink-0" />}
          <Skeleton className="size-8 shrink-0 rounded-md" />
        </div>
        <div className="flex h-10 shrink-0 items-center gap-1 bg-muted p-1">
          <Skeleton className="h-8 w-14 bg-background/70" />
          <Skeleton className="h-8 w-24 bg-background/70" />
          <Skeleton className="h-8 w-14 bg-background/70" />
        </div>
      </div>
      <div className="min-h-0 w-full flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full min-h-0 min-w-300 flex-col overflow-hidden border">
          <div className="grid shrink-0 grid-cols-7">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="flex h-10 items-center justify-center border p-2"
              >
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
            ))}
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-7 auto-rows-fr">
            {Array.from({ length: 42 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "flex min-h-0 min-w-0 flex-col gap-2 border p-2",
                  fixedHeight && "h-45",
                )}
              >
                <div className="flex items-center justify-between">
                  <Skeleton
                    className={cn(
                      "size-5 rounded-md",
                      index === 17 && "size-8 rounded-full",
                    )}
                  />
                  {index % 3 !== 0 && (
                    <Skeleton className="size-6 rounded-md" />
                  )}
                </div>
                {index % 4 === 0 && (
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-5 w-full rounded-sm" />
                    {index % 8 === 0 && (
                      <Skeleton className="h-5 w-3/4 rounded-sm" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
