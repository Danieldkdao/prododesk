"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatus, taskStatuses } from "@/db/shared";
import { useConfetti } from "@/hooks/use-confetti";
import { formatTaskDates } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { CheckIcon, ClockIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  GetTasksActionReturnType,
  updateTasksStatusAction,
} from "../actions/actions";
import {
  formatTaskPriority,
  formatTaskStatus,
  getTaskPriorityBadgeClasses,
} from "../lib/formatters";
import { TaskDialog } from "./task-dialog";
import { TaskOptions } from "./task-options";

export const Task = ({
  task,
  disabled = false,
  includeDay = false,
  index,
}: {
  task: GetTasksActionReturnType["tasks"][number];
  includeDay?: boolean;
  disabled?: boolean;
  index: number;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [taskStatus, setTaskStatus] = useState(task.status);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);
  const { triggerConfetti } = useConfetti();

  const updateTaskStatus = (newStatus: TaskStatus) => {
    if (disabled) return;

    const prevStatus = taskStatus;
    setTaskStatus(newStatus);

    startTransition(async () => {
      const response = await updateTasksStatusAction(task.id, newStatus);
      if (response.error) {
        toast.error(response.message);
        setTaskStatus(prevStatus);
      } else {
        if (response.allComplete) {
          triggerConfetti();
        }
        router.refresh();
      }
    });
  };

  const priorityBadgeClasses = getTaskPriorityBadgeClasses(task.priority);
  const isTaskComplete = taskStatus === "completed";
  const TaskStatusIcon = formatTaskStatus(taskStatus).icon;

  return (
    <>
      <TaskDialog
        existingTask={task}
        defaultValues={{ project: task.project }}
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
      />
      <div
        className={cn(
          "group flex items-start gap-2 border-b py-3 last:border-b-0 shadow-sm animate-in fade-in slide-in-from-top-2",
          disabled && "opacity-50",
        )}
        style={{
          animationDuration: `${200 * (index + 1)}ms`,
        }}
      >
        <Select
          value={taskStatus}
          onValueChange={(value) => updateTaskStatus(value as TaskStatus)}
          open={statusSelectOpen}
          onOpenChange={setStatusSelectOpen}
        >
          <SelectTrigger
            disabled={disabled || isPending}
            className="cursor-pointer h-5! border-none"
            showIcon={false}
          >
            <SelectValue>
              <TaskStatusIcon
                className={cn("size-5", isTaskComplete && "text-emerald-600")}
              />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {taskStatuses.map((status) => {
              const { label, icon: Icon } = formatTaskStatus(status);

              return (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    <Icon />
                    <span>{label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <div
          className="min-w-0 flex-1 flex flex-col gap-1.5 cursor-pointer"
          onClick={() => setStatusSelectOpen((prev) => !prev)}
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

          {task.description && (
            <p
              className={cn(
                "text-base leading-5",
                isTaskComplete ? "text-emerald-600" : "text-muted-foreground",
              )}
            >
              {task.description}
            </p>
          )}
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
        </div>
        <TaskOptions task={task} />
      </div>
    </>
  );
};
