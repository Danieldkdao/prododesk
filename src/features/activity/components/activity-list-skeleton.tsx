import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PAGE_SIZE } from "@/lib/constants";
import { ActivitySkeleton } from "./activity-skeleton";

export const ActivityListSkeleton = ({
  showProject = false,
}: {
  showProject?: boolean;
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full items-center gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="size-9 shrink-0" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {showProject && <TableHead>Project</TableHead>}
            <TableHead>Message</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <ActivitySkeleton
              key={index}
              showProject={showProject}
              index={index}
            />
          ))}
        </TableBody>
      </Table>
      <Separator />
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-44" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-9" />
          <Skeleton className="size-9" />
        </div>
      </div>
    </div>
  );
};
