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
  GetTasksActionReturnType,
  updateTasksPriorityAction,
  updateTasksStatusAction,
} from "@/features/tasks/actions/actions";
import { ProjectTaskBoard } from "@/features/tasks/components/project-task-board";
import { ProjectTasksInfiniteList } from "@/features/tasks/components/project-tasks-infinite-list";
import { TasksFilters } from "@/features/tasks/components/tasks-filters";
import {
  formatTaskPriority,
  formatTaskStatus,
} from "@/features/tasks/lib/formatters";
import { useState } from "react";
import { BoardProperty } from "../lib/types";

export const ProjectTasksView = ({
  projectId,
  response,
}: {
  projectId: string;
  response: GetTasksActionReturnType;
}) => {
  const { tasks, metadata } = response;

  const [boardViewKind, setBoardViewKind] = useState<BoardProperty>("status");

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

  const tasksClientKey =
    `${tasks.map(
      (task) => `
    ${task.name}
    ${task.createdAt.toISOString()}
    ${task.description}
    ${task.dueAt ? task.dueAt.toISOString() : "no due date"}
    ${task.emoji || "no emoji"}${task.id}${task.priority}
    ${task.projectId || "no project"}
    ${task.scheduledAt ? task.scheduledAt.toISOString() : "no scheduled date"}
    ${task.status}${task.updatedAt.toISOString()}
    ${task.userId}`,
    )}
  ` +
    `${metadata.hasNextPage ? "has next page" : "no next page"}${metadata.allTasksCompleted ? "all tasks complete" : "some tasks remain"}`;

  return (
    <Tabs defaultValue="list">
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-2 w-full">
          <TasksFilters defaultProject={currentProject} />
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<TabsTrigger value="board">Board</TabsTrigger>}
              />
              <DropdownMenuContent>
                <DropdownMenuRadioGroup
                  value={boardViewKind}
                  onValueChange={setBoardViewKind}
                >
                  <DropdownMenuRadioItem value="status">
                    Status
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="priority">
                    Priority
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </TabsList>
        </div>
        <TabsContent value="list">
          <ProjectTasksInfiniteList
            key={tasksClientKey}
            project={currentProject}
            initialTasks={tasks}
            initialHasNextPage={metadata.hasNextPage}
            allTasksCompleted={metadata.allTasksCompleted}
          />
        </TabsContent>
        <TabsContent value="board">
          {boardViewKind === "status" ? (
            <ProjectTaskBoard
              key={currentProject.id}
              project={currentProject}
              initialTasks={tasks}
              property="status"
              propertyOptions={taskStatuses}
              formatter={formatTaskStatus}
              saveOnMoveEnd={updateTasksStatusAction}
            />
          ) : (
            <ProjectTaskBoard
              key={currentProject.id}
              project={currentProject}
              initialTasks={tasks}
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
