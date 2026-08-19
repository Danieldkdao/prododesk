import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SkeletonProps = {
  showProject?: boolean;
};

export const AreaProjectTasksSkeleton = ({
  showProject = false,
}: SkeletonProps) => {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex w-full flex-col gap-2 md:flex-row md:items-center">
        <Skeleton className="h-9 min-w-0 flex-1" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-9 shrink-0" />
          <Skeleton className="size-9 shrink-0" />
          <div className="flex h-9 shrink-0 items-center gap-1 bg-muted p-1">
            <Skeleton className="h-7 w-14 bg-background/70" />
            <Skeleton className="h-7 w-16 bg-background/70" />
          </div>
        </div>
      </div>
      <div className="w-full overflow-hidden border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Scheduled At</TableHead>
              <TableHead>Due At</TableHead>
              {!showProject && <TableHead>Project</TableHead>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, index) => (
              <AreaProjectTaskSkeleton key={index} showProject={showProject} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export const AreaProjectTaskSkeleton = ({
  showProject = false,
}: SkeletonProps) => {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-5 w-36" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-42" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      {!showProject && (
        <TableCell>
          <Skeleton className="h-4 w-28" />
        </TableCell>
      )}
      <TableCell>
        <Skeleton className="size-8" />
      </TableCell>
    </TableRow>
  );
};
