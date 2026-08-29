"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskSelectType } from "@/db/schema";
import { ComponentProps, ReactElement, useState } from "react";
import { TaskForm } from "./task-form";
import { SetterType } from "@/lib/types";
import { TaskFormDefaultValues } from "../lib/types";

export const TaskDialog = ({
  defaultValues,
  children,
  existingTask,
  open,
  onOpenChange,
  afterAction,
  ...triggerProps
}: {
  defaultValues?: TaskFormDefaultValues;
  children?: ReactElement;
  existingTask?: TaskSelectType;
  open?: boolean;
  onOpenChange?: SetterType<boolean>;
  afterAction?: () => void | Promise<void>;
} & Omit<ComponentProps<typeof DialogTrigger>, "render" | "children">) => {
  const [isOpen, setIsOpen] = useState(false);

  const openToUse = open ?? isOpen;
  const handleOpenChange = onOpenChange ?? setIsOpen;

  return (
    <Dialog open={openToUse} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger {...triggerProps} render={children} />}
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
          defaultValues={defaultValues}
          existingTask={existingTask}
          afterAction={async () => {
            handleOpenChange(false);
            await afterAction?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
