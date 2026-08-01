"use client";

import { Button } from "@/components/ui/button";
import { ProjectSelectType, TaskSelectType } from "@/db/schema";
import { BoardProperty } from "@/features/projects/lib/types";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/react";
import { LucideIcon, PlusIcon } from "lucide-react";
import { ReactNode } from "react";
import { TaskDialog } from "./task-dialog";

export const TaskBoardColumn = <
  PropertyOption extends TaskSelectType[BoardProperty],
>({
  property,
  propertyValue,
  project,
  children,
  formatter,
}: {
  property: BoardProperty;
  propertyValue: PropertyOption;
  project: ProjectSelectType;
  children?: ReactNode;
  formatter: (option: PropertyOption) => {
    label: string;
    icon: LucideIcon;
    textColor: string;
  };
}) => {
  const { ref, isDropTarget } = useDroppable({
    id: propertyValue as string,
  });

  const { label, icon: StatusIcon, textColor } = formatter(propertyValue);

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
        <TaskDialog defaultValues={{ [property]: propertyValue, project }}>
          <Button variant="ghost" size="icon-sm">
            <PlusIcon />
          </Button>
        </TaskDialog>
      </div>
      <div className="flex flex-col gap-2 p-2">{children}</div>
    </div>
  );
};
