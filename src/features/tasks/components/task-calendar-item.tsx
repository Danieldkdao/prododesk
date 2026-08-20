import { cn } from "@/components/tiptap/lib/tiptap-utils";
import { TaskSelectType } from "@/db/schema";
import { formatTaskPriority, formatTaskStatus } from "../lib/formatters";

export const TaskCalendarItem = ({ task }: { task: TaskSelectType }) => {
  const { icon: StatusIcon, textColor: statusTextColor } = formatTaskStatus(
    task.status,
  );
  const { borderColor } = formatTaskPriority(task.priority);

  return (
    <div
      className={cn(
        "w-full min-w-0 flex flex-col gap-1 px-2 py-1 border-l-4 bg-accent",
        borderColor,
      )}
    >
      <div className="w-full min-w-0 flex items-center gap-2">
        <StatusIcon className={cn("size-4 shrink-0", statusTextColor)} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block">
            {task.name}
          </span>
        </div>
      </div>
    </div>
  );
};
