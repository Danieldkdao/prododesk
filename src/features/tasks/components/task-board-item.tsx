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
import { TooltipWrapper } from "@/components/tooltip-wrapper";

export const TaskBoardItem = ({
  task,
  className,
  minimizeSmallScreens = false,
  property,
}: {
  task: TaskSelectType & { project?: ProjectSelectType | null };
  className?: string;
  minimizeSmallScreens?: boolean;
  property?: BoardProperty;
}) => {
  const { ref } = useDraggable({
    id: task.id,
    type: "task",
  });

  const priorityBadgeClasses = getTaskPriorityBadgeClasses(task.priority);
  const {
    icon: StatusIcon,
    textColor: statusTextColor,
    label: statusLabel,
  } = formatTaskStatus(task.status);
  const {
    icon: PriorityIcon,
    textColor: priorityTextColor,
    label: priorityLabel,
  } = formatTaskPriority(task.priority);

  return (
    <div
      ref={ref}
      className={cn(
        "p-2 bg-background cursor-pointer flex",
        className,
        minimizeSmallScreens && "items-center lg:items-stretch",
      )}
    >
      <div className="flex-1 min-w-0 p-2 flex flex-col gap-1">
        <div className="min-w-0">
          <div className="flex items-start gap-2 min-w-0 leading-7">
            {(property === "priority" || !property) && (
              <TooltipWrapper content={statusLabel}>
                <span className="h-[1lh] flex items-center">
                  <StatusIcon
                    className={cn("size-5 shrink-0", statusTextColor)}
                  />
                </span>
              </TooltipWrapper>
            )}
            {(property === "status" || !property) && (
              <TooltipWrapper content={priorityLabel}>
                <span
                  className={cn(
                    "h-[1lh] flex items-center",
                    minimizeSmallScreens && "lg:hidden",
                  )}
                >
                  <PriorityIcon
                    className={cn("size-5 shrink-0", priorityTextColor)}
                  />
                </span>
              </TooltipWrapper>
            )}
            <span
              className={cn(
                "text-lg font-medium",
                minimizeSmallScreens && "whitespace-nowrap",
              )}
            >
              {task.name}
            </span>
            {!property && (
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 px-1.5 py-0 text-sm font-medium normal-case tracking-normal self-center",
                  priorityBadgeClasses,
                  minimizeSmallScreens && "hidden lg:block",
                )}
              >
                {priorityLabel}
              </Badge>
            )}
          </div>
          <p
            className={cn(
              "text-base text-muted-foreground",
              !task.description && "italic",
              minimizeSmallScreens && "hidden lg:inline",
            )}
          >
            {task.description || "No description provided"}
          </p>
        </div>
        <div
          className={cn(
            "flex items-start leading-6 gap-1 text-sm text-muted-foreground",
            minimizeSmallScreens && "hidden lg:flex",
          )}
        >
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
