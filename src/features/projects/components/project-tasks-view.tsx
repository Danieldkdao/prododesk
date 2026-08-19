"use client";

import { ErrorState } from "@/components/error-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { taskPriorities, taskStatuses } from "@/db/shared";
import {
  ReadTasksActionReturnType,
  updateTasksPriorityAction,
  updateTasksStatusAction,
} from "@/features/tasks/actions/actions";
import { TaskBoard } from "@/features/tasks/components/task-board";
import { ProjectTasksInfiniteList } from "@/features/tasks/components/project-tasks-infinite-list";
import { TasksFilters } from "@/features/tasks/components/tasks-filters";
import {
  formatTaskPriority,
  formatTaskStatus,
} from "@/features/tasks/lib/formatters";
import { useState } from "react";
import { BoardProperty } from "../lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CircleIcon, FlagIcon } from "lucide-react";

export const ProjectTasksView = ({
  projectId,
  listResponse,
  boardResponse,
}: {
  projectId: string;
  listResponse: ReadTasksActionReturnType;
  boardResponse: ReadTasksActionReturnType;
}) => {
  const { tasks: listTasks, metadata } = listResponse;
  const { tasks: boardTasks } = boardResponse;

  const [tabValue, setTabValue] = useState<"list" | "board">("list");
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
  if (!currentProject) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your project. Try refreshing the page or come back later if the issue persists."
      />
    );
  }

  return (
    <Tabs defaultValue="list" value={tabValue} onValueChange={setTabValue}>
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col md:flex-row md:items-center gap-2 w-full">
          <TasksFilters defaultProject={currentProject} />
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger
              nativeButton={false}
              value="board"
              render={
                <div className="flex items-center gap-2">
                  Board
                  <Select
                    value={boardViewKind}
                    onValueChange={(value) => {
                      setBoardViewKind(value as BoardProperty);
                      setTabValue("board");
                    }}
                  >
                    <SelectTrigger className="w-fit border-none">
                      <SelectValue>
                        {currentSelectedBoardViewKind && (
                          <currentSelectedBoardViewKind.icon className="size-4" />
                        )}
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
                </div>
              }
            ></TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="list">
          <ProjectTasksInfiniteList
            key={metadata.clientKey}
            project={currentProject}
            initialTasks={listTasks}
            initialHasNextPage={metadata.hasNextPage}
            allTasksCompleted={metadata.allTasksCompleted}
          />
        </TabsContent>
        <TabsContent value="board">
          {boardViewKind === "status" ? (
            <TaskBoard
              key={currentProject.id}
              project={currentProject}
              initialTasks={boardTasks}
              property="status"
              propertyOptions={taskStatuses}
              formatter={formatTaskStatus}
              saveOnMoveEnd={updateTasksStatusAction}
            />
          ) : (
            <TaskBoard
              key={currentProject.id}
              project={currentProject}
              initialTasks={boardTasks}
              property="priority"
              propertyOptions={taskPriorities}
              formatter={formatTaskPriority}
              saveOnMoveEnd={updateTasksPriorityAction}
            />
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
};
