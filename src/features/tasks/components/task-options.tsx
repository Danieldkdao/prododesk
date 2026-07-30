"use client";

import { ProjectSelectType, TaskSelectType } from "@/db/schema";
import { TaskDialog } from "./task-dialog";
import { ReactElement, ReactNode, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EditIcon, EllipsisVerticalIcon, Trash2Icon } from "lucide-react";
import { DeleteTaskButton } from "./delete-task-button";

export const TaskOptions = ({
  task,
  children,
}: {
  task: TaskSelectType & { project: ProjectSelectType | null };
  children?: ReactElement;
}) => {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  return (
    <>
      <TaskDialog
        existingTask={task}
        defaultValues={{ project: task.project }}
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            children ?? (
              <Button variant="ghost" size="icon-xs">
                <EllipsisVerticalIcon />
              </Button>
            )
          }
        />
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setUpdateDialogOpen(true)}>
            <EditIcon />
            Update task
          </DropdownMenuItem>

          <DropdownMenuItem
            nativeButton
            variant="destructive"
            render={
              <DeleteTaskButton
                taskId={task.id}
                variant="destructive"
                className="w-full h-auto py-2 px-3.5 justify-start bg-transparent focus:bg-destructive/10 dark:focus:bg-destructive/20"
              />
            }
          >
            <Trash2Icon />
            Delete task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
