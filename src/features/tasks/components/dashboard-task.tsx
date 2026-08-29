"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTaskDates } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ClockIcon, DotIcon, MoreHorizontalIcon } from "lucide-react";
import { Fragment, JSX, useState } from "react";
import { ReadTasksActionReturnType } from "../actions/actions";
import { useTaskDetailsDialog } from "../hooks/use-task-details-dialog";
import {
  formatTaskPriority,
  formatTaskStatus,
  getTaskPriorityBadgeClasses,
} from "../lib/formatters";
import { UpdateTaskStatusSelect } from "../update-task-status-select";
import { TaskOptions } from "./task-options";

export const DashboardTask = ({
  task,
  variant = "today",
}: {
  task: ReadTasksActionReturnType["tasks"][number];
  variant?: "today" | "next-up";
}) => {
  const [taskStatus, setTaskStatus] = useState(task.status);
  const { openTaskDetails } = useTaskDetailsDialog();

  const {
    icon: StatusIcon,
    textColor: statusTextColor,
    label: taskStatusLabel,
  } = formatTaskStatus(taskStatus);
  const priorityBadgeClasses = getTaskPriorityBadgeClasses(task.priority);

  const isTaskComplete = taskStatus === "completed";

  const {
    label: taskPriorityLabel,
    icon: PriorityIcon,
    textColor: priorityTextColor,
  } = formatTaskPriority(task.priority);

  const taskStats = [
    task.project ? () => <span>{task.project?.name}</span> : null,
    () => (
      <div className="flex items-center gap-2">
        <StatusIcon className={cn("size-4", statusTextColor)} />
        <span>{taskStatusLabel}</span>
      </div>
    ),
    () => (
      <div className="flex items-center gap-2">
        <PriorityIcon className={cn("size-4", priorityTextColor)} />
        <span>{taskPriorityLabel}</span>
      </div>
    ),
  ];
  const taskStatsToRender = taskStats.filter(
    (stat): stat is () => JSX.Element => stat !== null,
  );

  if (variant === "today") {
    return (
      <div className="w-full p-4 border-t border-b last:border-b-0 min-w-0 flex gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <UpdateTaskStatusSelect
            taskId={task.id}
            status={taskStatus}
            outsideStatus={taskStatus}
            setOutsideStatus={setTaskStatus}
          >
            <StatusIcon
              className={cn(
                "size-6 shrink-0 mt-2",
                taskStatus === "completed" && "text-emerald-600",
                statusTextColor,
              )}
            />
          </UpdateTaskStatusSelect>
          <div
            className="flex flex-col gap-px min-w-0 flex-1 cursor-pointer"
            onClick={() => openTaskDetails(task.id)}
          >
            <span
              className={cn(
                "text-lg font-semibold truncate",
                isTaskComplete && "text-emerald-600 line-through",
              )}
            >
              {task.name}
            </span>
            <span>{formatTaskDates(task.scheduledAt, task.dueAt, true)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 px-1.5 py-0 text-sm font-medium normal-case tracking-normal",
              priorityBadgeClasses,
            )}
          >
            {formatTaskPriority(task.priority).label}
          </Badge>
          <TaskOptions task={task}>
            <Button variant="ghost" size="icon">
              <MoreHorizontalIcon />
            </Button>
          </TaskOptions>
        </div>
      </div>
    );
  } else if (variant === "next-up") {
    return (
      <div
        className="p-4 border-t border-b last:border-b-0 flex flex-col gap-4 cursor-pointer"
        onClick={() => openTaskDetails(task.id)}
      >
        <div className="flex items-center gap-2">
          <ClockIcon className="size-4" />
          <span className="leading-none">
            {task.scheduledAt
              ? format(task.scheduledAt, "p")
              : task.dueAt
                ? `Due ${format(task.dueAt, "p")}`
                : "No date"}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-base font-semibold leading-none">
            {task.name}
          </span>
          <div className="flex items-center gap-x-px gap-y-1 flex-wrap">
            {taskStatsToRender.map((StatComponent, index) => (
              <Fragment key={index}>
                <StatComponent />
                <DotIcon className="size-5 text-muted-foreground/50 last:hidden" />
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }
};
