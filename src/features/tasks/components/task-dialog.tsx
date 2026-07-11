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

export const TaskDialog = ({
  children,
  day,
  existingTask,
}: {
  children: ReactElement;
  day: Date;
  existingTask?: TaskTableSelectType;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={children} />
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
