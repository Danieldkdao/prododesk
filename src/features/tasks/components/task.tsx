"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useConfetti } from "@/hooks/use-confetti";
import { formatTaskDates } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { CheckIcon, ClockIcon } from "lucide-react";
import { useState } from "react";
import { ReadTasksActionReturnType } from "../actions/actions";
import {
  formatTaskPriority,
  getTaskPriorityBadgeClasses,
} from "../lib/formatters";
import { UpdateTaskStatusSelect } from "../update-task-status-select";
import { TaskDialog } from "./task-dialog";
import { TaskDetailsTrigger } from "./task-details-trigger";
import { TaskOptions } from "./task-options";

export const Task = ({
  task,
  disabled = false,
  includeDay = false,
}: {
  task: ReadTasksActionReturnType["tasks"][number];
  includeDay?: boolean;
  disabled?: boolean;
}) => {
  const [taskStatus, setTaskStatus] = useState(task.status);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const { triggerConfetti } = useConfetti();

  const priorityBadgeClasses = getTaskPriorityBadgeClasses(task.priority);
  const isTaskComplete = taskStatus === "completed";

  return (
    <>
      <TaskDialog
        existingTask={task}
        defaultValues={{ project: task.project, milestone: task.milestone }}
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
      />
      <div
        className={cn(
          "group flex items-start gap-2 border-b py-3 last:border-b-0 shadow-sm",
          disabled && "opacity-50",
        )}
      >
        <UpdateTaskStatusSelect
          taskId={task.id}
          status={taskStatus}
          disabled={disabled}
          afterAction={({ allComplete }) => {
            if (allComplete) {
              triggerConfetti();
            }
          }}
          childrenClassName={cn(isTaskComplete && "text-emerald-600")}
          outsideStatus={taskStatus}
          setOutsideStatus={setTaskStatus}
        />
        <TaskDetailsTrigger
          taskId={task.id}
          className="min-w-0 flex-1 flex flex-col gap-1.5"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Label
              htmlFor={`task-${task.id}`}
              className={cn(
                "min-w-0 cursor-pointer text-lg font-medium leading-5 normal-case!",
                isTaskComplete && "line-through text-emerald-600",
              )}
            >
              {task.emoji && <span>{task.emoji}</span>}
              {task.name}
            </Label>
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
              "text-base leading-5",
              isTaskComplete ? "text-emerald-600" : "text-muted-foreground",
              !task.description && "italic",
            )}
          >
            {task.description || "No description provided."}
          </p>
          {isTaskComplete ? (
            <div className="flex items-center gap-1 text-sm text-emerald-600">
              <CheckIcon className="size-3.5" />
              <span>Completed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ClockIcon className="size-3.5 shrink-0" />
              <span>
                {formatTaskDates(task.scheduledAt, task.dueAt, includeDay)}
              </span>
            </div>
          )}
        </TaskDetailsTrigger>
        <TaskOptions task={task} />
      </div>
    </>
  );
};
