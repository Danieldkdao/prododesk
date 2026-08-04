import { Skeleton } from "@/components/ui/skeleton";

export const AreasSkeleton = () => {
  return (
    <div className="mx-auto flex w-full max-w-384 flex-col gap-4 p-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="size-9" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <AreaSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export const AreaSkeleton = () => {
  return (
    <div className="flex min-h-52 w-full flex-col border border-l-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-10 shrink-0" />
          <Skeleton className="h-7 w-28" />
        </div>
        <Skeleton className="size-8 shrink-0" />
      </div>
      <div className="mt-6 space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </div>
      <div className="mt-auto pt-6">
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
  );
};
