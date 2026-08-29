"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatus, taskStatuses } from "@/db/shared";
import { cn } from "@/lib/utils";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateTasksStatusAction } from "../actions/actions";
import { formatTaskStatus } from "../lib/formatters";

export const TaskStatusSelect = ({
  taskId,
  initialStatus,
}: {
  taskId: string;
  initialStatus: TaskStatus;
  className?: string;
}) => {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [isStatusPending, startStatusTransition] = useTransition();

  const {
    label: statusLabel,
    icon: StatusIcon,
    textColor: statusTextColor,
  } = formatTaskStatus(currentStatus);

  const handleStatusUpdate = (newStatus: TaskStatus) => {
    const prevStatus = currentStatus;
    setCurrentStatus(newStatus);

    startStatusTransition(async () => {
      const response = await updateTasksStatusAction(taskId, newStatus);
      if (response.error) {
        toast.error(response.message);
        setCurrentStatus(prevStatus);
      }
    });
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={(status) => handleStatusUpdate(status as TaskStatus)}
    >
      <SelectTrigger
        className="w-fit border-none"
        disabled={isStatusPending}
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue placeholder="Select a status">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("size-5", statusTextColor)} />
            <span className="text-base">{statusLabel}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
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
  );
};
