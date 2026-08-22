"use client";

import { TaskStatus, taskStatuses } from "@/db/shared";
import { ReactNode, useState, useTransition } from "react";
import { updateTasksStatusAction } from "./actions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTaskStatus } from "./lib/formatters";
import { cn } from "@/lib/utils";
import { SetterType } from "@/lib/types";

export const UpdateTaskStatusSelect = ({
  taskId,
  status,
  disabled = false,
  afterAction,
  children,
  childrenClassName,
  outsideStatus,
  setOutsideStatus,
  outsideOpen,
  setOutsideOpen,
}: {
  taskId: string;
  status: TaskStatus;
  disabled?: boolean;
  afterAction?: ({
    message,
    allComplete,
  }: {
    message: string;
    allComplete: boolean;
  }) => void;
  children?: ReactNode;
  childrenClassName?: string;
  outsideStatus?: TaskStatus;
  setOutsideStatus?: SetterType<TaskStatus>;
  outsideOpen?: boolean;
  setOutsideOpen?: SetterType<boolean>;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [taskStatus, setTaskStatus] = useState(status);
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);

  const taskStatusToUse = outsideStatus ?? taskStatus;
  const setTaskStatusToUse = setOutsideStatus ?? setTaskStatus;

  const statusSelectOpenToUse = outsideOpen ?? statusSelectOpen;
  const setStatusSelectOpenToUse = setOutsideOpen ?? setStatusSelectOpen;

  const updateTaskStatus = (newStatus: TaskStatus) => {
    if (disabled) return;

    const prevStatus = taskStatusToUse;
    setTaskStatusToUse(newStatus);

    startTransition(async () => {
      const response = await updateTasksStatusAction(taskId, newStatus);
      if (response.error) {
        toast.error(response.message);
        setTaskStatusToUse(prevStatus);
      } else {
        router.refresh();
        afterAction?.({
          message: response.message,
          allComplete: response.allComplete ?? false,
        });
      }
    });
  };

  const TaskStatusIcon = formatTaskStatus(taskStatusToUse).icon;

  return (
    <Select
      value={taskStatusToUse}
      onValueChange={(value) => updateTaskStatus(value as TaskStatus)}
      open={statusSelectOpenToUse}
      onOpenChange={setStatusSelectOpenToUse}
    >
      <SelectTrigger
        disabled={disabled || isPending}
        className="cursor-pointer h-5! border-none"
        showIcon={false}
      >
        <SelectValue>
          {children ?? (
            <TaskStatusIcon className={cn("size-5", childrenClassName)} />
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {taskStatuses.map((status) => {
          const { label, icon: Icon, textColor } = formatTaskStatus(status);

          return (
            <SelectItem key={status} value={status}>
              <div className="flex items-center gap-2">
                <Icon className={cn(textColor)} />
                <span>{label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
