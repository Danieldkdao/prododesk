"use client";

import { ProjectSelectType, TaskSelectType } from "@/db/schema";
import { useDraggable } from "@dnd-kit/react";
import { TaskOptions } from "./task-options";
import { Button } from "@/components/ui/button";
import { ClockIcon, EllipsisIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTaskDates } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import {
  formatTaskPriority,
  formatTaskStatus,
  getTaskPriorityBadgeClasses,
} from "../lib/formatters";
import { BoardProperty } from "@/features/projects/lib/types";

export const TaskBoardItem = ({
  task,
  property,
}: {
  task: TaskSelectType & { project: ProjectSelectType | null };
  property: BoardProperty;
}) => {
  const { ref } = useDraggable({
    id: task.id,
  });

  const priorityBadgeClasses = getTaskPriorityBadgeClasses(task.priority);
  const { icon: StatusIcon, textColor } = formatTaskStatus(task.status);

  return (
    <div ref={ref} className="p-2 bg-background cursor-pointer flex">
      <div className="flex-1 min-w-0 p-2 flex flex-col gap-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {property === "priority" && (
              <StatusIcon className={cn("size-5", textColor)} />
            )}
            <span className="text-lg font-medium">{task.name}</span>
            {property === "status" && (
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 px-1.5 py-0 text-sm font-medium normal-case tracking-normal",
                  priorityBadgeClasses,
                )}
              >
                {formatTaskPriority(task.priority).label}
              </Badge>
            )}
          </div>
          <p
            className={cn(
              "text-base text-muted-foreground",
              !task.description && "italic",
            )}
          >
            {task.description || "No description provided"}
          </p>
        </div>
        <div className="flex items-start leading-6 gap-1 text-sm text-muted-foreground">
          <span className="shrink-0 h-[1lh] flex items-center">
            <ClockIcon className="size-3.5 shrink-0" />
          </span>
          <span>{formatTaskDates(task.scheduledAt, task.dueAt, true)}</span>
        </div>
      </div>
      <TaskOptions task={task}>
        <Button variant="ghost" size="icon-sm">
          <EllipsisIcon />
        </Button>
      </TaskOptions>
    </div>
  );
};
