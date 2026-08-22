import { ActivitySelectType } from "@/db/schema";
import {
  formatActivityMessage,
  formatActivitySubject,
} from "../lib/formatters";

export const DashboardActivityItem = ({
  activity,
}: {
  activity: ActivitySelectType;
}) => {
  const { icon: SubjectIcon } = formatActivitySubject(activity.subject);

  return (
    <div
      key={activity.id}
      className="flex items-start gap-2 w-full min-w-0 leading-7"
    >
      <span className="h-[1lh] flex items-center shrink-0">
        <SubjectIcon className="text-muted-foreground" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-lg text-muted-foreground">
          {formatActivityMessage(activity)}
        </p>
      </div>
    </div>
  );
};
