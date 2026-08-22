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
import { ActivityViewOption } from "../lib/activity-params";
import {
  ActivityCompactItemSkeleton,
  ActivityTableRowSkeleton,
} from "./activity-skeleton";

export const ActivityListSkeleton = ({
  showProject = false,
  view = "table",
}: {
  showProject?: boolean;
  view?: ActivityViewOption;
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full items-center gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="size-9 shrink-0" />
      </div>
      {view === "table" ? (
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
              <ActivityTableRowSkeleton
                key={index}
                showProject={showProject}
                index={index}
              />
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col gap-2">
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <ActivityCompactItemSkeleton key={index} index={index} />
          ))}
        </div>
      )}
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
