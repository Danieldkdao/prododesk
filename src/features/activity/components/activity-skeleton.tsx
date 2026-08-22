import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

export const ActivityTableRowSkeleton = ({
  showProject = false,
  index,
}: {
  showProject?: boolean;
  index: number;
}) => {
  return (
    <TableRow>
      {showProject && (
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 shrink-0" />
            <Skeleton className={index % 2 === 0 ? "h-5 w-28" : "h-5 w-36"} />
          </div>
        </TableCell>
      )}
      <TableCell>
        <Skeleton
          className={
            index % 3 === 0
              ? "h-5 w-64"
              : index % 3 === 1
                ? "h-5 w-52"
                : "h-5 w-72"
          }
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 shrink-0 rounded-sm" />
          <Skeleton className="h-5 w-16" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 shrink-0 rounded-sm" />
          <Skeleton className="h-5 w-16" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 shrink-0 rounded-sm" />
          <Skeleton className="h-5 w-20" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-24" />
      </TableCell>
    </TableRow>
  );
};

export const ActivityCompactItemSkeleton = ({ index }: { index: number }) => {
  return (
    <div className="flex w-full min-w-0 items-start gap-2 leading-7">
      <span className="flex h-[1lh] shrink-0 items-center">
        <Skeleton className="size-6 rounded-sm" />
      </span>
      <div className="min-w-0 flex-1 py-1">
        <Skeleton
          className={
            index % 3 === 0
              ? "h-5 w-80 max-w-full"
              : index % 3 === 1
                ? "h-5 w-64 max-w-full"
                : "h-5 w-96 max-w-full"
          }
        />
      </div>
    </div>
  );
};
