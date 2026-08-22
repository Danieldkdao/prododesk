import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

export const ActivitySkeleton = ({
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
