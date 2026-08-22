"use client";

import { cn } from "@/lib/utils";
import { ReadTasksActionReturnType } from "../actions/actions";
import {
  formatTaskPriority,
  formatTaskStatus,
  getTaskPriorityBadgeClasses,
} from "../lib/formatters";
import { formatTaskDates } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { TaskOptions } from "./task-options";
import { Button } from "@/components/ui/button";
import { MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { UpdateTaskStatusSelect } from "../update-task-status-select";

export const DashboardTask = ({
  task,
}: {
  task: ReadTasksActionReturnType["tasks"][number];
}) => {
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);

  const { icon: StatusIcon, textColor: statusTextColor } = formatTaskStatus(
    task.status,
  );
  const priorityBadgeClasses = getTaskPriorityBadgeClasses(task.priority);

  return (
    <div
      key={task.id}
      className="w-full p-4 border-t last:border-b min-w-0 flex gap-2"
    >
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <UpdateTaskStatusSelect
          taskId={task.id}
          status={task.status}
          childrenClassName={cn(
            task.status === "completed" && "text-emerald-600",
          )}
          outsideOpen={statusSelectOpen}
          setOutsideOpen={setStatusSelectOpen}
        >
          <StatusIcon className={cn("size-6 shrink-0 mt-2", statusTextColor)} />
        </UpdateTaskStatusSelect>
        <div
          className="flex flex-col gap-px min-w-0 flex-1 cursor-pointer"
          onClick={() => setStatusSelectOpen(true)}
        >
          <span className="text-lg font-semibold truncate">{task.name}</span>
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
};
