"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import {
  ReadTasksActionReturnType,
  updateTasksPriorityAction,
  updateTasksStatusAction,
} from "../actions/actions";
import { format } from "date-fns";
import { formatTaskPriority, formatTaskStatus } from "../lib/formatters";
import { cn } from "@/lib/utils";
import { TaskOptions } from "./task-options";
import { Button } from "@/components/ui/button";
import { MoreHorizontalIcon, SquareArrowOutUpRightIcon } from "lucide-react";
import { useState, useTransition } from "react";
import {
  taskPriorities,
  TaskPriority,
  TaskStatus,
  taskStatuses,
} from "@/db/shared";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export const TaskTableRow = ({
  task,
  showProject = false,
}: {
  task: ReadTasksActionReturnType["tasks"][number];
  showProject?: boolean;
}) => {
  const [currentStatus, setCurrentStatus] = useState(task.status);
  const [currentPriority, setCurrentPriority] = useState(task.priority);

  const [isStatusPending, startStatusTransition] = useTransition();
  const [isPriorityPending, startPriorityTransition] = useTransition();

  const {
    label: statusLabel,
    icon: StatusIcon,
    textColor: statusTextColor,
  } = formatTaskStatus(currentStatus);
  const {
    label: priorityLabel,
    icon: PriorityIcon,
    textColor: priorityTextColor,
  } = formatTaskPriority(currentPriority);

  const handleStatusUpdate = (newStatus: TaskStatus) => {
    const prevStatus = currentStatus;
    setCurrentStatus(newStatus);

    startStatusTransition(async () => {
      const response = await updateTasksStatusAction(task.id, newStatus);
      if (response.error) {
        toast.error(response.message);
        setCurrentStatus(prevStatus);
      }
    });
  };

  const handlePriorityUpdate = (newPriority: TaskPriority) => {
    const prevPriority = currentPriority;
    setCurrentPriority(newPriority);

    startPriorityTransition(async () => {
      const response = await updateTasksPriorityAction(task.id, newPriority);
      if (response.error) {
        toast.error(response.message);
        setCurrentPriority(prevPriority);
      }
    });
  };

  return (
    <TableRow key={task.id}>
      <TableCell className="font-medium text-base">{task.name}</TableCell>
      <TableCell>
        <Select
          value={currentStatus}
          onValueChange={(status) => handleStatusUpdate(status as TaskStatus)}
        >
          <SelectTrigger
            className="w-fit border-none"
            disabled={isStatusPending}
          >
            <SelectValue placeholder="Select a status">
              <div className="flex items-center gap-2">
                <StatusIcon className={cn("size-5", statusTextColor)} />
                <span className="text-base">{statusLabel}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {taskStatuses.map((status) => {
              const { label, icon: Icon, textColor } = formatTaskStatus(status);

              return (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn("size-5", textColor)} />
                    <span className="text-base">{label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={currentPriority}
          onValueChange={(priority) =>
            handlePriorityUpdate(priority as TaskPriority)
          }
        >
          <SelectTrigger
            className="w-fit border-none"
            disabled={isPriorityPending}
          >
            <SelectValue>
              <div className="flex items-center gap-2">
                <PriorityIcon className={cn("size-5", priorityTextColor)} />
                <span className="text-base">{priorityLabel}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {taskPriorities.map((priority) => {
              const {
                label,
                icon: Icon,
                textColor,
              } = formatTaskPriority(priority);

              return (
                <SelectItem key={priority} value={priority}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn("size-5", textColor)} />
                    <span className="text-base">{label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <span className="text-base">{task.description}</span>
      </TableCell>
      <TableCell className="text-base">
        {task.scheduledAt
          ? format(task.scheduledAt, "PP p")
          : "No scheduled date"}
      </TableCell>
      <TableCell className="text-base">
        {task.dueAt ? format(task.dueAt, "PP p") : "No due date"}
      </TableCell>
      {showProject && task.project && (
        <TableCell className="text-base">
          <Link
            href={`/dashboard/projects/${task.project.id}`}
            target="_blank"
            className="flex items-center gap-2"
          >
            <span>{task.project.name}</span>
            <SquareArrowOutUpRightIcon className="size-4" />
          </Link>
        </TableCell>
      )}
      <TableCell>
        <TaskOptions task={task}>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontalIcon />
          </Button>
        </TaskOptions>
      </TableCell>
    </TableRow>
  );
};
