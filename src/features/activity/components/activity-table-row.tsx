"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { ReadActivityActionReturnType } from "../actions/actions";
import {
  formatActivityAction,
  formatActivitySource,
  formatActivitySubject,
} from "../lib/formatters";
import { ClockIcon, SquareArrowOutUpRightIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useTaskDetailsDialog } from "@/features/tasks/hooks/use-task-details-dialog";

export const ActivityTableRow = ({
  activity,
  showProject = false,
}: {
  activity: ReadActivityActionReturnType["activity"][number];
  showProject?: boolean;
}) => {
  const { openTaskDetails } = useTaskDetailsDialog();
  const { label: sourceLabel, icon: SourceIcon } = formatActivitySource(
    activity.source,
  );
  const { label: actionLabel, icon: ActionIcon } = formatActivityAction(
    activity.action,
  );
  const { label: subjectLabel, icon: SubjectIcon } = formatActivitySubject(
    activity.subject,
  );

  const createdAt = formatDistanceToNow(activity.createdAt, {
    addSuffix: true,
    includeSeconds: true,
  });

  const handleTaskDetails = () => {
    if (
      activity.subject === "task" &&
      activity.subjectId &&
      activity.action !== "delete"
    ) {
      openTaskDetails(activity.subjectId);
    }
  };

  return (
    <TableRow className="cursor-pointer" onClick={handleTaskDetails}>
      {showProject && (
        <TableCell className="text-base" onClick={(e) => e.stopPropagation()}>
          {activity.project ? (
            <Link
              href={`/dashboard/projects/${activity.project.id}`}
              target="_blank"
              className="flex items-center gap-2"
            >
              <span>{activity.project.name}</span>
              <SquareArrowOutUpRightIcon className="size-4" />
            </Link>
          ) : (
            <span className="italic">No project</span>
          )}
        </TableCell>
      )}
      <TableCell className="font-medium text-base">
        {activity.message}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <SourceIcon className="size-5" />
          <span className="text-base">{sourceLabel}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <ActionIcon className="size-5" />
          <span className="text-base">{actionLabel}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <SubjectIcon className="size-5" />
          <span className="text-base">{subjectLabel}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <ClockIcon className="size-5" />
          <span className="text-base">
            {createdAt.at(0)?.toUpperCase() + createdAt.slice(1)}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
};
