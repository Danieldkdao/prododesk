"use client";

import { Dialog } from "@/components/ui/dialog";
import { Suspense } from "react";
import { useTaskDetailsDialog } from "../hooks/use-task-details-dialog";
import { TaskDialogDetails } from "./task-dialog-details";

export const TaskDetailsDialog = () => {
  return (
    <Suspense>
      <TaskDetailsDialogSuspense />
    </Suspense>
  );
};

const TaskDetailsDialogSuspense = () => {
  const { taskId, closeTaskDetails } = useTaskDetailsDialog();

  return (
    <Dialog
      open={taskId !== null}
      onOpenChange={(open) => {
        if (!open) {
          closeTaskDetails();
        }
      }}
    >
      {taskId && <TaskDialogDetails key={taskId} taskId={taskId} />}
    </Dialog>
  );
};
