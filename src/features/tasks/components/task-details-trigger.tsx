"use client";

import { ReactNode } from "react";
import { useTaskDetailsDialog } from "../hooks/use-task-details-dialog";
import { cn } from "@/lib/utils";

export const TaskDetailsTrigger = ({
  taskId,
  className,
  children,
}: {
  taskId: string;
  className?: string;
  children: ReactNode;
}) => {
  const { openTaskDetails } = useTaskDetailsDialog();

  return (
    <div
      className={cn("cursor-pointer", className)}
      onClick={() => openTaskDetails(taskId)}
    >
      {children}
    </div>
  );
};
