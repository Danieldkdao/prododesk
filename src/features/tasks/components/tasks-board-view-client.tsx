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
import { BoardProperty } from "@/features/tasks/lib/types";
import {
  ReadTasksActionReturnType,
  TaskBoardData,
  TaskBoardFilters,
  updateTasksPriorityAction,
  updateTasksStatusAction,
} from "@/features/tasks/actions/actions";
import { TaskBoard } from "@/features/tasks/components/task-board";
import {
  formatTaskPriority,
  formatTaskStatus,
} from "@/features/tasks/lib/formatters";
import { CircleIcon, FlagIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const TasksBoardViewClient = ({
  response,
  filters,
  projectId,
}: {
  response: TaskBoardData;
  filters: TaskBoardFilters;
  projectId?: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isChangingProperty, startTransition] = useTransition();

  const boardViewKind = response.property;

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

  const currentProject = response.projects.find(
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
        disabled={isChangingProperty}
        onValueChange={(value) => {
          const nextProperty = value as BoardProperty;
          const params = new URLSearchParams(searchParams.toString());

          if (nextProperty === "status") {
            params.delete("boardBy");
          } else {
            params.set("boardBy", nextProperty);
          }

          startTransition(() => {
            router.push(`${pathname}${params.size ? `?${params}` : ""}`);
          });
        }}
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
          key={response.queryKey}
          initialData={response}
          filters={filters}
          property="status"
          propertyOptions={taskStatuses}
          project={currentProject}
          formatter={formatTaskStatus}
          saveOnMoveEnd={updateTasksStatusAction}
        />
      ) : (
        <TaskBoard
          key={response.queryKey}
          initialData={response}
          filters={filters}
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
