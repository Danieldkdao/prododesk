"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { TaskSelectType } from "@/db/schema";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatTaskStatus, formatTaskPriority } from "../lib/formatters";
import { useTaskDetailsDialog } from "../hooks/use-task-details-dialog";

export const OverviewTasksTableRow = ({ task }: { task: TaskSelectType }) => {
  const { openTaskDetails } = useTaskDetailsDialog();

  const {
    label: taskStatusLabel,
    icon: TaskStatusIcon,
    textColor: taskStatusTextColor,
  } = formatTaskStatus(task.status);
  const {
    label: taskPriorityLabel,
    icon: TaskPriorityIcon,
    textColor: taskPriorityTextColor,
  } = formatTaskPriority(task.priority);

  return (
    <TableRow
      key={task.id}
      className="cursor-pointer"
      onClick={() => openTaskDetails(task.id)}
    >
      <TableCell className="font-medium text-base">{task.name}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <TaskStatusIcon className={cn("size-5", taskStatusTextColor)} />
          <span className="text-base font-medium">{taskStatusLabel}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <TaskPriorityIcon className={cn("size-5", taskPriorityTextColor)} />
          <span className="text-base font-medium">{taskPriorityLabel}</span>
        </div>
      </TableCell>
      <TableCell className="text-center text-base">
        {task.dueAt ? format(task.dueAt, "PP") : "-"}
      </TableCell>
    </TableRow>
  );
};
