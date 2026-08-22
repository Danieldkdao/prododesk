import { ActivitySelectType } from "@/db/schema";
import {
  formatActivityMessage,
  formatActivitySubject,
} from "../lib/formatters";
import { cn } from "@/lib/utils";

export const DashboardActivityItem = ({
  activity,
  textColorClassName = "text-foreground",
}: {
  activity: ActivitySelectType;
  textColorClassName?: string;
}) => {
  const { icon: SubjectIcon } = formatActivitySubject(activity.subject);

  return (
    <div
      key={activity.id}
      className="flex items-start gap-2 w-full min-w-0 leading-7"
    >
      <span className="h-[1lh] flex items-center shrink-0">
        <SubjectIcon className={textColorClassName} />
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn("text-lg", textColorClassName)}>
          {formatActivityMessage(activity)}
        </p>
      </div>
    </div>
  );
};
