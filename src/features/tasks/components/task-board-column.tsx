"use client";

import { TaskStatus } from "@/db/shared";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/react";
import { ReactNode } from "react";
import { formatTaskStatus } from "../lib/formatters";
import { TaskDialog } from "./task-dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { ProjectSelectType } from "@/db/schema";

export const TaskBoardColumn = ({
  status,
  project,
  children,
}: {
  status: TaskStatus;
  project: ProjectSelectType;
  children?: ReactNode;
}) => {
  const { ref, isDropTarget } = useDroppable({
    id: status,
  });

  const { label, icon: StatusIcon, textColor } = formatTaskStatus(status);

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 w-full bg-muted transition-all duration-300",
        isDropTarget && "bg-primary/15 outline-2 outline-primary/40",
      )}
    >
      <div className="px-4 pt-4 w-full flex items-center gap-2">
        <div className="w-full flex items-center gap-2 flex-1 min-w-0">
          <StatusIcon className={cn("size-5", textColor)} />
          <span className="text-xl font-medium">{label}</span>
        </div>
        <TaskDialog defaultValues={{ status, project }}>
          <Button variant="ghost" size="icon-sm">
            <PlusIcon />
          </Button>
        </TaskDialog>
      </div>
      <div
        className={cn("flex flex-col gap-2 transition-all duration-200 p-2")}
      >
        {children}
      </div>
    </div>
  );
};
