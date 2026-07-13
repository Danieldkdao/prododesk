"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskTableSelectType } from "@/db/schema";
import { ReactElement, useState } from "react";
import { TaskForm } from "./task-form";
import { SetterType } from "@/lib/types";

export const TaskDialog = ({
  children,
  day,
  existingTask,
  open,
  onOpenChange,
}: {
  children?: ReactElement;
  day: Date;
  existingTask?: TaskTableSelectType;
  open?: boolean;
  onOpenChange?: SetterType<boolean>;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openToUse = open ?? isOpen;
  const handleOpenChange = onOpenChange ?? setIsOpen;

  return (
    <Dialog open={openToUse} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger render={children} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existingTask ? "Update task" : "Create task"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {existingTask ? "Update task" : "Create task"}
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          day={day}
          existingTask={existingTask}
          afterAction={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
