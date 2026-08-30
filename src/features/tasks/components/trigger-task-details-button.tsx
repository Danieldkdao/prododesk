"use client";

import { Button } from "@/components/ui/button";
import { ComponentProps } from "react";
import { useTaskDetailsDialog } from "../hooks/use-task-details-dialog";

export const TriggerTaskDetailsButton = ({
  taskId,
  children,
  ...props
}: { taskId: string } & Omit<ComponentProps<typeof Button>, "onClick">) => {
  const { openTaskDetails } = useTaskDetailsDialog();

  return (
    <Button {...props} onClick={() => openTaskDetails(taskId)}>
      {children}
    </Button>
  );
};
