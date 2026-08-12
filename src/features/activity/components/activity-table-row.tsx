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

export const ActivityTableRow = ({
  activity,
  showProject = false,
}: {
  activity: ReadActivityActionReturnType["activity"][number];
  showProject?: boolean;
}) => {
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

  return (
    <TableRow>
      {showProject && (
        <TableCell className="text-base">
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
