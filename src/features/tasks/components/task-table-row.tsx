"use client";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { MoreHorizontalIcon, SquareArrowOutUpRightIcon } from "lucide-react";
import Link from "next/link";
import { ReadTasksActionReturnType } from "../actions/actions";
import { useTaskDetailsDialog } from "../hooks/use-task-details-dialog";
import { TaskOptions } from "./task-options";
import { TaskPriorityUpdater } from "./task-priority-updater";
import { TaskStatusUpdater } from "./task-status-updater";

export const TaskTableRow = ({
  task,
  showProject = false,
}: {
  task: ReadTasksActionReturnType["tasks"][number];
  showProject?: boolean;
}) => {
  const { openTaskDetails } = useTaskDetailsDialog();

  return (
    <TableRow
      key={task.id}
      className="cursor-pointer"
      onClick={() => openTaskDetails(task.id)}
    >
      <TableCell className="font-medium text-base">{task.name}</TableCell>
      <TableCell>
        <TaskStatusUpdater taskId={task.id} initialStatus={task.status} />
      </TableCell>
      <TableCell>
        <TaskPriorityUpdater taskId={task.id} initialPriority={task.priority} />
      </TableCell>
      <TableCell>
        <span className={cn("text-base", !task.description && "italic")}>
          {task.description || "No description provided."}
        </span>
      </TableCell>
      <TableCell className="text-base">
        {task.scheduledAt
          ? format(task.scheduledAt, "PP p")
          : "No scheduled date"}
      </TableCell>
      <TableCell className="text-base">
        {task.dueAt ? format(task.dueAt, "PP p") : "No due date"}
      </TableCell>
      {showProject && (
        <TableCell className="text-base">
          {task.project ? (
            <Link
              href={`/dashboard/projects/${task.project.id}`}
              target="_blank"
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span>{task.project.name}</span>
              <SquareArrowOutUpRightIcon className="size-4" />
            </Link>
          ) : (
            <span className="italic">No project</span>
          )}
        </TableCell>
      )}
      <TableCell>
        <div onClick={(e) => e.stopPropagation()}>
          <TaskOptions task={task}>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontalIcon />
            </Button>
          </TaskOptions>
        </div>
      </TableCell>
    </TableRow>
  );
};
