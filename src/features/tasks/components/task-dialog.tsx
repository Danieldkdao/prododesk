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
  defaultDay,
  defaultProject,
  children,
  existingTask,
  open,
  onOpenChange,
}: {
  defaultDay?: Date | null;
  defaultProject?: { id: string; name: string; icon?: string | null } | null;
  children?: ReactElement;
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
            {existingTask ? "Update Task" : "Create Task"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {existingTask ? "Update Task" : "Create Task"}
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          defaultDay={defaultDay}
          defaultProject={defaultProject}
          existingTask={existingTask}
          afterAction={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
