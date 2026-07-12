"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TaskTableSelectType } from "@/db/schema";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { toggleTaskCompletionAction } from "../actions/actions";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, ClockIcon } from "lucide-react";
import { format, isSameDay } from "date-fns";
import {
  formatTaskPriority,
  getTaskPriorityBadgeClasses,
} from "../lib/formatters";

export const Task = ({
  task,
  disabled = false,
}: {
  task: TaskTableSelectType;
  disabled?: boolean;
}) => {
  const router = useRouter();
  const [isComplete, setIsComplete] = useOptimistic(task.isCompleted);
  const [completedAt, setCompletedAt] = useOptimistic(task.completedAt);
  const [isPending, startTransition] = useTransition();

  const toggleTaskCompletion = () => {
    startTransition(async () => {
      setIsComplete((prev) => !prev);
      setCompletedAt(new Date());

      const response = await toggleTaskCompletionAction(task.id);
      if (response.error) {
        toast.error(response.message);
      } else {
        router.refresh();
      }
    });
  };

  const cursorClassName = disabled ? "cursor-not-allowed" : "cursor-pointer";
  const priorityBadgeClasses = getTaskPriorityBadgeClasses(task.priority);

  return (
    <div
      className={cn(
        "group flex items-start gap-2 border-b py-3 last:border-b-0",
        disabled && "opacity-50",
      )}
    >
      <Checkbox
        id={`task-${task.id}`}
        checked={isComplete}
        onCheckedChange={toggleTaskCompletion}
        disabled={disabled || isPending}
        className="mt-0.5"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <Label
            htmlFor={`task-${task.id}`}
            className={cn(
              "min-w-0 cursor-pointer text-sm font-medium leading-5",
              isComplete && "line-through text-emerald-600",
            )}
          >
            {task.emoji && <span>{task.emoji}</span>}
            {task.name}
          </Label>

          <Badge
            variant="outline"
            className={cn(
              "shrink-0 px-1.5 py-0 text-[10px] font-medium normal-case",
              priorityBadgeClasses,
            )}
          >
            {formatTaskPriority(task.priority)}
          </Badge>
        </div>

        {isComplete && completedAt ? (
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
            <CheckIcon className="size-3.5" />
            <span>
              Completed{" "}
              {isSameDay(task.day, completedAt)
                ? `at ${format(completedAt, "h:mm a")}`
                : `${format(completedAt, "LLL d")} at ${format(completedAt, "h:mm a")}`}
            </span>
          </div>
        ) : (
          task.startAt && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon className="size-3.5" />

              <span>
                {format(task.startAt, "h:mm a")}
                {task.endAt && ` – ${format(task.endAt, "h:mm a")}`}
              </span>
            </div>
          )
        )}

        {task.description && (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {task.description}
          </p>
        )}
      </div>
    </div>
  );
};
