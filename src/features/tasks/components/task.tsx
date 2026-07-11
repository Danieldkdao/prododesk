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
import { ClockIcon } from "lucide-react";
import { format } from "date-fns";

export const Task = ({
  task,
  disabled = false,
}: {
  task: TaskTableSelectType;
  disabled?: boolean;
}) => {
  const router = useRouter();
  const [isComplete, setIsComplete] = useOptimistic(task.isCompleted);
  const [isPending, startTransition] = useTransition();

  const toggleTaskCompletion = () => {
    startTransition(async () => {
      setIsComplete((prev) => !prev);

      const response = await toggleTaskCompletionAction(task.id);
      if (response.error) {
        toast.error(response.message);
      } else {
        router.refresh();
      }
    });
  };

  const cursorClassName = disabled ? "cursor-not-allowed" : "cursor-pointer";

  return (
    <div className={cn("flex items-start gap-2", cursorClassName)}>
      <Checkbox
        id={`task-${task.id}`}
        checked={isComplete}
        onCheckedChange={toggleTaskCompletion}
        className={cn("mt-1", cursorClassName)}
        disabled={disabled || isPending}
      />
      <div className={cn("flex flex-col gap-0.5", disabled && "opacity-50")}>
        <Label htmlFor={`task-${task.id}`} className={cursorClassName}>
          <span
            className={cn(
              "font-medium text-base normal-case!",
              isComplete && "text-muted-foreground line-through",
            )}
          >
            {task.emoji} {task.name}
          </span>
        </Label>
        {task.startAt && (
          <Badge>
            <ClockIcon />
            <span>{format(task.startAt, "hh:mm a")}</span>
            {task.endAt && (
              <>
                <span>-</span>
                <ClockIcon />
                <span>{format(task.endAt, "hh:mm a")}</span>
              </>
            )}
          </Badge>
        )}
        <p className="text-sm text-muted-foreground">{task.description}</p>
      </div>
    </div>
  );
};
