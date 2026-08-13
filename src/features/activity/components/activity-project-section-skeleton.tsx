import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PAGE_SIZE } from "@/lib/constants";

export const ActivityProjectSectionSkeleton = ({
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
            <TableRow key={index}>
              {showProject && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-5 shrink-0" />
                    <Skeleton
                      className={index % 2 === 0 ? "h-5 w-28" : "h-5 w-36"}
                    />
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
