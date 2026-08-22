"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditIcon, EllipsisVerticalIcon, Trash2Icon } from "lucide-react";
import { ReactElement, useState } from "react";
import { ReadTasksActionReturnType } from "../actions/actions";
import { DeleteTaskButton } from "./delete-task-button";
import { TaskDialog } from "./task-dialog";

export const TaskOptions = ({
  task,
  children,
}: {
  task: ReadTasksActionReturnType["tasks"][number];
  children?: ReactElement;
}) => {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  return (
    <>
      <TaskDialog
        existingTask={task}
        defaultValues={{ project: task.project, milestone: task.milestone }}
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
