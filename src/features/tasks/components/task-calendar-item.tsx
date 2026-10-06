import { cn } from "@/components/tiptap/lib/tiptap-utils";
import { TaskSelectType } from "@/db/schema";
import { calendarDateKey } from "@/features/calendar/lib/calendar-dates";
import { tz } from "@date-fns/tz";
import { format } from "date-fns";
import { formatTaskPriority, formatTaskStatus } from "../lib/formatters";

export const TaskCalendarItem = ({
  task,
  date,
  timeZone,
}: {
  task: TaskSelectType;
  date: Date;
  timeZone: string;
}) => {
  const { icon: StatusIcon, textColor: statusTextColor } = formatTaskStatus(
    task.status,
  );
  const { borderColor } = formatTaskPriority(task.priority);

  const dayKey = calendarDateKey(date);
  const isTaskScheduledForDay = task.scheduledAt
    ? format(task.scheduledAt, "yyyy-MM-dd", { in: tz(timeZone) }) === dayKey
    : false;
  const isTaskDueForDay = task.dueAt
    ? format(task.dueAt, "yyyy-MM-dd", { in: tz(timeZone) }) === dayKey
    : false;

  return (
    <div
      className={cn(
        "w-full min-w-0 flex flex-col gap-0.5 px-2 py-1 border-l-4 bg-accent",
        borderColor,
      )}
    >
      <div className="w-full min-w-0 flex items-center gap-2">
        <StatusIcon className={cn("size-4 shrink-0", statusTextColor)} />
        <div className="flex-1 min-w-0">
          <span
            className="text-sm font-medium truncate block"
            title={task.name}
          >
            {task.name}
          </span>
        </div>
      </div>
      {(isTaskScheduledForDay || isTaskDueForDay) && (
        <div className="ml-6 flex items-center flex-wrap gap-1 text-sm font-medium leading-3">
          {isTaskScheduledForDay && (
            <span className="rounded-sm bg-sky-500/10 px-1 py-0.5 text-sky-700 dark:text-sky-300">
              Scheduled
            </span>
          )}
          {isTaskDueForDay && (
            <span className="rounded-sm bg-amber-500/10 px-1 py-0.5 text-amber-800 dark:text-amber-300">
              Due
            </span>
          )}
        </div>
      )}
    </div>
  );
};
