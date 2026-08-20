"use client";

import { ErrorState } from "@/components/error-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { taskPriorities, taskStatuses } from "@/db/shared";
import { BoardProperty } from "@/features/projects/lib/types";
import {
  ReadTasksActionReturnType,
  updateTasksPriorityAction,
  updateTasksStatusAction,
} from "@/features/tasks/actions/actions";
import { TaskBoard } from "@/features/tasks/components/task-board";
import {
  formatTaskPriority,
  formatTaskStatus,
} from "@/features/tasks/lib/formatters";
import { CircleIcon, FlagIcon } from "lucide-react";
import { useState } from "react";

export const TasksBoardViewClient = ({
  response,
  projectId,
}: {
  response: ReadTasksActionReturnType;
  projectId?: string;
}) => {
  const { tasks, metadata } = response;

  const [boardViewKind, setBoardViewKind] = useState<BoardProperty>("status");

  const boardViewKinds = [
    {
      icon: CircleIcon,
      label: "Status",
      value: "status",
    },
    {
      icon: FlagIcon,
      label: "Priority",
      value: "priority",
    },
  ];

  const currentSelectedBoardViewKind = boardViewKinds.find(
    (kind) => kind.value === boardViewKind,
  );

  const currentProject = metadata.projects?.find(
    (project) => project.id === projectId,
  );
  if (projectId && !currentProject)
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your project. Try refreshing the page or come back later if the issue persists."
      />
    );

  return (
    <div className="flex flex-col gap-4">
      <Select
        value={boardViewKind}
        onValueChange={(value) => setBoardViewKind(value as BoardProperty)}
      >
        <SelectTrigger className="w-fit border-none flex items-center gap-2">
          <p className="text-base font-medium text-muted-foreground">
            Organize task columns by{" "}
          </p>
          <SelectValue>
            <div className="flex items-center gap-2">
              {currentSelectedBoardViewKind && (
                <currentSelectedBoardViewKind.icon className="size-5" />
              )}
              <span className="text-base font-medium text-muted-foreground">
                {currentSelectedBoardViewKind?.label}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          {boardViewKinds.map((kind) => (
            <SelectItem key={kind.value} value={kind.value}>
              <kind.icon className="size-5" />
              <span>{kind.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {boardViewKind === "status" ? (
        <TaskBoard
          initialTasks={tasks}
          property="status"
          propertyOptions={taskStatuses}
          project={currentProject}
          formatter={formatTaskStatus}
          saveOnMoveEnd={updateTasksStatusAction}
        />
      ) : (
        <TaskBoard
          initialTasks={tasks}
          property="priority"
          project={currentProject}
          propertyOptions={taskPriorities}
          formatter={formatTaskPriority}
          saveOnMoveEnd={updateTasksPriorityAction}
        />
      )}
    </div>
  );
};
