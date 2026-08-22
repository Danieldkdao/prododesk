"use client";

import { Fragment } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PAGE_SIZE } from "@/lib/constants";
import { ReadActivityActionReturnType } from "../actions/actions";
import { useActivityParams } from "../hooks/use-activity-params";
import {
  ActivityCompactItemSkeleton,
  ActivityTableRowSkeleton,
} from "./activity-skeleton";
import { ActivityTableRow } from "./activity-table-row";
import { DashboardActivityItem } from "./dashboard-activity-item";
import { Separator } from "@/components/ui/separator";

export const ActivityListViews = ({
  activity,
  showProject = false,
  isPending = false,
}: {
  activity: ReadActivityActionReturnType["activity"];
  showProject?: boolean;
  isPending?: boolean;
}) => {
  const [filters] = useActivityParams();
  const view = filters.view;

  if (view === "table") {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {showProject && <TableHead>Project</TableHead>}
            <TableHead>Activity</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activity.map((a) => (
            <ActivityTableRow
              key={a.id}
              activity={a}
              showProject={showProject}
            />
          ))}
          {isPending &&
            Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <ActivityTableRowSkeleton
                key={index}
                showProject={showProject}
                index={index}
              />
            ))}
        </TableBody>
      </Table>
    );
  } else if (view === "compact") {
    return (
      <div className="flex flex-col gap-2">
        {activity.map((a) => (
          <Fragment key={a.id}>
            <DashboardActivityItem
              activity={a}
              textColorClassName="text-foreground"
            />
            <Separator className="last:hidden" />
          </Fragment>
        ))}
        {isPending &&
          Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <ActivityCompactItemSkeleton key={index} index={index} />
          ))}
      </div>
    );
  }
  return null;
};
