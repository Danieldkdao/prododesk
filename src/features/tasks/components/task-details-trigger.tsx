"use client";

import { ComponentProps, ReactNode } from "react";
import { useTaskDetailsDialog } from "../hooks/use-task-details-dialog";
import { cn } from "@/lib/utils";

export const TaskDetailsTrigger = ({
  taskId,
  className,
  children,
  ...props
}: {
  taskId: string;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"div">, "onClick" | "onKeyDown">) => {
  const { openTaskDetails } = useTaskDetailsDialog();

  return (
    <div
      {...props}
      className={cn("cursor-pointer", className)}
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        openTaskDetails(taskId);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        openTaskDetails(taskId);
      }}
    >
      {children}
    </div>
  );
};
