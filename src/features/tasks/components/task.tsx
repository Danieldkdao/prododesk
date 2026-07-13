"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { TaskTableSelectType } from "@/db/schema";
import { cn } from "@/lib/utils";
import { format, isSameDay, parse } from "date-fns";
import {
  CheckIcon,
  ClockIcon,
  EditIcon,
  EllipsisVerticalIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleTaskCompletionAction } from "../actions/actions";
import {
  formatTaskPriority,
  getTaskPriorityBadgeClasses,
} from "../lib/formatters";
import { DeleteTaskButton } from "./delete-task-button";
import { TaskDialog } from "./task-dialog";
import { useConfetti } from "@/hooks/use-confetti";

export const Task = ({
  task,
  disabled = false,
  index,
}: {
  task: TaskTableSelectType;
  disabled?: boolean;
  index: number;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isComplete, setIsComplete] = useState(task.isCompleted);
  const [completedAt, setCompletedAt] = useState(task.completedAt);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const { triggerConfetti } = useConfetti();

  const toggleTaskCompletion = () => {
    if (disabled) return;

    setIsComplete((prev) => !prev);
    setCompletedAt(!isComplete ? new Date() : null);

    startTransition(async () => {
      const response = await toggleTaskCompletionAction(task.id);
      if (response.error) {
        toast.error(response.message);
        setIsComplete((prev) => !prev);
        setCompletedAt(!isComplete ? new Date() : null);
      } else {
        if (response.allComplete) {
          triggerConfetti();
        }
        router.refresh();
      }
    });
  };

  const priorityBadgeClasses = getTaskPriorityBadgeClasses(task.priority);
  const taskDay = parse(task.day, "yyyy-MM-dd", new Date());

  return (
    <>
      <TaskDialog
        day={parse(task.day, "yyyy-MM-dd", new Date())}
        existingTask={task}
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
        <Checkbox
          id={`task-${task.id}`}
          checked={isComplete}
          onCheckedChange={toggleTaskCompletion}
          disabled={disabled || isPending}
          className="mt-0.5"
        />

        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          <div className="flex items-start gap-3 justify-between min-w-0">
            <div className="flex items-center gap-2">
              <Label
                htmlFor={`task-${task.id}`}
                className={cn(
                  "min-w-0 cursor-pointer text-lg font-medium leading-5 normal-case!",
                  isComplete && "line-through text-emerald-600",
                )}
              >
                {task.emoji && <span>{task.emoji}</span>}
                {task.name}
              </Label>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 px-1.5 py-0 text-[12px] font-medium normal-case",
                  priorityBadgeClasses,
                )}
              >
                {formatTaskPriority(task.priority)}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="size-5 [&_svg:not([class*='size-'])]:size-4"
                  >
                    <EllipsisVerticalIcon />
                  </Button>
                }
              />
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setUpdateDialogOpen(true)}>
                  <EditIcon />
                  Update task
                </DropdownMenuItem>

                <DropdownMenuItem
                  nativeButton
                  variant="destructive"
                  render={
                    <DeleteTaskButton
                      taskId={task.id}
                      variant="destructive"
                      className="w-full h-auto py-2 px-3.5 justify-start bg-transparent focus:bg-destructive/10 dark:focus:bg-destructive/20"
                    />
                  }
                >
                  <Trash2Icon />
                  Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {task.description && (
            <p
              className={cn(
                "text-base leading-5",
                isComplete && completedAt
                  ? "text-emerald-600"
                  : "text-muted-foreground",
              )}
            >
              {task.description}
            </p>
          )}
          {isComplete && completedAt ? (
            <div className="flex items-center gap-1 text-sm text-emerald-600">
              <CheckIcon className="size-3.5" />
              <span>
                Completed{" "}
                {isSameDay(taskDay, completedAt)
                  ? `at ${format(completedAt, "h:mm a")}`
                  : `${format(completedAt, "LLL d")} at ${format(completedAt, "h:mm a")}`}
              </span>
            </div>
          ) : (
            task.startAt && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <ClockIcon className="size-3.5" />

                <span>
                  {format(task.startAt, "h:mm a")}
                  {task.endAt && ` – ${format(task.endAt, "h:mm a")}`}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
};
