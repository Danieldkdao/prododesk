"use client";

import { taskPriorities, TaskPriority } from "@/db/shared";
import { useState, useTransition } from "react";
import { formatTaskPriority } from "../lib/formatters";
import { updateTasksPriorityAction } from "../actions/actions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const TaskPrioritySelect = ({
  taskId,
  initialPriority,
}: {
  taskId: string;
  initialPriority: TaskPriority;
}) => {
  const [currentPriority, setCurrentPriority] = useState(initialPriority);
  const [isPriorityPending, startPriorityTransition] = useTransition();

  const {
    label: priorityLabel,
    icon: PriorityIcon,
    textColor: priorityTextColor,
  } = formatTaskPriority(currentPriority);

  const handlePriorityUpdate = (newPriority: TaskPriority) => {
    const prevPriority = currentPriority;
    setCurrentPriority(newPriority);

    startPriorityTransition(async () => {
      const response = await updateTasksPriorityAction(taskId, newPriority);
      if (response.error) {
        toast.error(response.message);
        setCurrentPriority(prevPriority);
      }
    });
  };

  return (
    <Select
      value={currentPriority}
      onValueChange={(priority) =>
        handlePriorityUpdate(priority as TaskPriority)
      }
    >
      <SelectTrigger
        className="w-fit border-none"
        disabled={isPriorityPending}
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue>
          <div className="flex items-center gap-2">
            <PriorityIcon className={cn("size-5", priorityTextColor)} />
            <span className="text-base">{priorityLabel}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        {taskPriorities.map((priority) => {
          const { label, icon: Icon, textColor } = formatTaskPriority(priority);

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
  );
};
