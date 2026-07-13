import { Skeleton } from "@/components/ui/skeleton";

export const MainCalendarSkeleton = () => {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="flex h-10 shrink-0 items-center justify-between border-b pl-2">
        <Skeleton className="h-7 w-40 rounded-md" />
        <div className="flex items-center">
          <Skeleton className="m-1 size-8 rounded-md" />
          <Skeleton className="m-1 size-8 rounded-md" />
        </div>
      </div>
      <div className="grid shrink-0 grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="flex h-10 items-center justify-center border-x border-b p-2"
          >
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 auto-rows-fr">
        {Array.from({ length: 42 }).map((_, index) => (
          <div key={index} className="flex min-h-0 min-w-0 flex-col border p-2">
            <div className="flex items-center justify-between">
              <Skeleton className="size-5 rounded-md" />

              {index % 4 === 0 && <Skeleton className="size-6 rounded-md" />}
            </div>

            {index % 5 === 0 && (
              <div className="flex flex-1 items-center justify-center">
                <Skeleton className="size-10 rounded-full" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
