"use client";

import { ArrowLeftIcon } from "@/components/tiptap/tiptap-icons/arrow-left-icon";
import { ArrowRightIcon } from "@/components/tiptap/tiptap-icons/arrow-right-icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReadProjectActivityActionReturnType } from "../actions/actions";
import { useActivityParams } from "../hooks/use-activity-params";
import { ActivityProjectTableRow } from "./activity-project-table-row";
import { DEFAULT_PAGE, PAGE_SIZE } from "@/lib/constants";
import { NotFound } from "@/components/not-found";

export const ActivityProjectTable = ({
  response,
}: {
  response: ReadProjectActivityActionReturnType;
}) => {
  const [filters, setFilters] = useActivityParams();

  const { activity, metadata } = response;

  const movePage = (amount: 1 | -1) => {
    setFilters({ page: filters.page + amount });
  };

  const resetFilters = () => {
    setFilters({
      page: DEFAULT_PAGE,
      search: "",
      actions: [],
      sortBy: "most_recent",
      sources: [],
      subjects: [],
    });
  };

  return activity.length ? (
    <div className="flex flex-col gap-4 w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Message</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activity.map((a) => (
            <ActivityProjectTableRow key={a.id} activity={a} />
          ))}
        </TableBody>
      </Table>
      <Separator />
      <div className="flex items-center gap-2 justify-between">
        <span className="text-muted-foreground">
          Showing {(filters.page - 1) * PAGE_SIZE + activity.length} results of{" "}
          {metadata.totalActivityCount} total
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => movePage(-1)}
            disabled={!metadata.hasPrevPage}
          >
            <ArrowLeftIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => movePage(1)}
            disabled={!metadata.hasNextPage}
          >
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
    </div>
  ) : (
    <NotFound
      title="No activity found"
      description="We were unable to find any activity in this project that match the selected filters. Try changing the filters or update this project."
    >
      <Button onClick={resetFilters} className="w-full">
        Reset filters
      </Button>
    </NotFound>
  );
};
