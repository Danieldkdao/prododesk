"use client";

import { Button } from "@/components/ui/button";
import { TaskStatus } from "@/db/shared";
import { useRouter } from "next/navigation";
import { ComponentProps, useTransition } from "react";
import { updateTasksStatusAction } from "../actions/actions";
import { toast } from "sonner";
import { useTaskDetailsDialog } from "../hooks/use-task-details-dialog";
import { LoadingSwap } from "@/components/ui/loading-swap";

export const UpdateTaskStatusButton = ({
  taskId,
  newStatus,
  children,
  disabled,
  ...props
}: {
  taskId: string;
  newStatus: TaskStatus;
} & Omit<ComponentProps<typeof Button>, "onClick">) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { closeTaskDetails } = useTaskDetailsDialog();

  const handleTaskStatusUpdate = () => {
    startTransition(async () => {
      const response = await updateTasksStatusAction(taskId, newStatus);
      if (response.error) {
        toast.error(response.message);
      } else {
        closeTaskDetails();
        router.refresh();
        toast.success(response.message);
      }
    });
  };

  return (
    <Button
      {...props}
      disabled={disabled || isPending}
      onClick={handleTaskStatusUpdate}
    >
      <LoadingSwap isLoading={isPending} className="flex items-center gap-2">
        {children}
      </LoadingSwap>
    </Button>
  );
};
