"use client";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { MoreHorizontalIcon, SquareArrowOutUpRightIcon } from "lucide-react";
import Link from "next/link";
import { ReadTasksActionReturnType } from "../actions/actions";
import { TaskDetailsTrigger } from "./task-details-trigger";
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
  return (
    <TableRow key={task.id}>
      <TableCell className="font-medium text-base">
        <TaskDetailsTrigger taskId={task.id} className="hover:underline">
          {task.name}
        </TaskDetailsTrigger>
      </TableCell>
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
        <div>
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
