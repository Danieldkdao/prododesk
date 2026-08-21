import { useDraggable } from "@dnd-kit/react";
import {
  formatTaskPriority,
  formatTaskStatus,
  getTaskPriorityBadgeClasses,
} from "../lib/formatters";
import {
  MilestoneSelectType,
  ProjectSelectType,
  TaskSelectType,
} from "@/db/schema";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TaskOptions } from "./task-options";
import { Button } from "@/components/ui/button";
import { EllipsisIcon } from "lucide-react";

export const TaskMilestoneItem = ({
  task,
}: {
  task: TaskSelectType & {
    project: ProjectSelectType | null;
    milestone: MilestoneSelectType | null;
  };
}) => {
  const { ref } = useDraggable({
    id: task.id,
    type: "task",
  });

  const priorityBadgeClasses = getTaskPriorityBadgeClasses(task.priority);
  const { icon: StatusIcon, textColor } = formatTaskStatus(task.status);

  return (
    <div
      key={task.id}
      ref={ref}
      className="bg-background border cursor-pointer flex items-center justify-between w-full min-w-0"
    >
      <div className="min-w-0 p-2 w-full">
        <div className="flex items-center gap-2 min-w-0">
          <StatusIcon className={cn("size-4 shrink-0", textColor)} />
          <span className="text-base font-medium">{task.name}</span>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 px-1.5 py-0 text-sm font-medium normal-case tracking-normal",
              priorityBadgeClasses,
            )}
          >
            {formatTaskPriority(task.priority).label}
          </Badge>
        </div>
        <p
          className={cn(
            "text-sm text-muted-foreground",
            !task.description && "italic",
          )}
        >
          {task.description || "No description provided"}
        </p>
      </div>
      <TaskOptions task={task}>
        <Button variant="ghost" size="icon-sm">
          <EllipsisIcon />
        </Button>
      </TaskOptions>
    </div>
  );
};
