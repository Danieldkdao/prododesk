import { TableCell, TableRow } from "@/components/ui/table";
import { ReadProjectActivityActionReturnType } from "../actions/actions";
import {
  formatActivityAction,
  formatActivitySource,
  formatActivitySubject,
} from "../lib/formatters";
import { ClockIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const ActivityProjectTableRow = ({
  activity,
}: {
  activity: ReadProjectActivityActionReturnType["activity"][number];
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
      <TableCell className="font-medium text-lg">{activity.message}</TableCell>
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
