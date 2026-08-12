import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export const AreaIdHeaderSkeleton = () => {
  return (
    <Card className="w-full min-w-0 border border-t-4 border-t-muted shadow-lg pb-0">
      <CardContent className="w-full min-w-0">
        <div className="flex flex-col items-start gap-8 md:flex-row">
          <div className="flex w-full min-w-0 items-start justify-between gap-2 md:w-fit">
            <Skeleton className="size-18 shrink-0" />
            <Skeleton className="size-12 shrink-0 md:hidden" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <Skeleton className="h-10 w-56 max-w-full sm:w-72" />
            <div className="flex w-full max-w-6xl flex-col gap-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5 sm:w-2/3" />
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <AreaStatisticSkeleton className="w-36" />
              <AreaStatisticSkeleton className="w-28" />
              <AreaStatisticSkeleton className="w-44" />
            </div>
          </div>
          <Skeleton className="hidden size-12 shrink-0 md:block" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full min-w-0">
          <div className="hidden items-center gap-2 md:flex">
            <AreaTabSkeleton className="w-28" />
            <AreaTabSkeleton className="w-28" hasCount />
            <AreaTabSkeleton className="w-24" hasCount />
            <AreaTabSkeleton className="w-32" />
            <AreaTabSkeleton className="w-28" />
          </div>
          <div className="flex h-9 w-full items-center justify-between md:hidden">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="size-4" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

const AreaStatisticSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="size-5 shrink-0" />
      <Skeleton className={`h-5 ${className ?? "w-32"}`} />
    </div>
  );
};

const AreaTabSkeleton = ({
  className,
  hasCount = false,
}: {
  className?: string;
  hasCount?: boolean;
}) => {
  return (
    <div className="flex h-10 items-center gap-2 px-3">
      <Skeleton className="size-5 shrink-0" />
      <Skeleton className={`h-5 ${className ?? "w-24"}`} />
      {hasCount && <Skeleton className="h-5 w-6 shrink-0" />}
    </div>
  );
};
