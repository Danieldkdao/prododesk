"use client";

import { MilestoneTasksInfiniteList } from "@/features/tasks/components/milestone-tasks-infinite-list";
import { TasksFilters } from "@/features/tasks/components/tasks-filters";
import { MilestonesFilters } from "./milestones-filters";
import { Separator } from "@/components/ui/separator";
import { MilestonesInfiniteList } from "./milestones-infinite-list";
import { ReadProjectMilestonesActionType } from "../actions/actions";
import {
  ReadTasksActionReturnType,
  updateTaskAction,
  updateTaskMilestoneAction,
} from "@/features/tasks/actions/actions";
import { DragDropProvider } from "@dnd-kit/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";

export const MilestonesView = ({
  projectId,
  milestonesResponse,
  tasksResponse,
}: {
  projectId: string;
  milestonesResponse: ReadProjectMilestonesActionType;
  tasksResponse: ReadTasksActionReturnType;
}) => {
  const { milestones: serverMilestones, metadata: milestonesMetadata } =
    milestonesResponse;
  const { tasks: serverTasks, metadata: tasksMetadata } = tasksResponse;

  const savesQueueRef = useRef(new Map<string, Promise<void>>());
  const [milestones, setMilestones] = useState(serverMilestones);
  const [tasks, setTasks] = useState(serverTasks);

  useEffect(() => {
    setMilestones(serverMilestones);
  }, [serverMilestones]);

  useEffect(() => {
    setTasks(serverTasks);
  }, [serverTasks]);

  const queueTaskMilestoneSave = useCallback(
    (taskId: string, milestoneId: string) => {
      const prevSave = savesQueueRef.current.get(taskId) ?? Promise.resolve();

      const nextSave = prevSave
        .catch(() => {})
        .then(async () => {
          const response = await updateTaskMilestoneAction(taskId, milestoneId);
          if (response.error)
            throw new Error("Failed to update task milestone.");
        });

      savesQueueRef.current.set(taskId, nextSave);

      void nextSave
        .catch((error) => {
          console.error(error);
          toast.error("Failed to update task milestone.");
        })
        .finally(() => {
          if (savesQueueRef.current.get(taskId) === nextSave) {
            savesQueueRef.current.delete(taskId);
          }
        });
    },
    [],
  );

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;

        const { source, target } = event.operation;

        if (!source?.id || !target?.id) return;

        const sourceTask = tasks.find((task) => task.id === source.id);
        if (
          !sourceTask ||
          sourceTask.milestoneId === target.id ||
          typeof target.id !== "string"
        )
          return;

        flushSync(() =>
          setTasks((prev) =>
            prev.map((task) => {
              if (task.id === source.id && task.milestoneId !== target.id)
                return { ...task, milestoneId: target.id as string };
              return task;
            }),
          ),
        );

        queueTaskMilestoneSave(sourceTask.id, target.id);
      }}
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full flex flex-col gap-4 md:max-w-100">
          <TasksFilters onlySearch />
          {/*todo: adjust layout later*/}
          <div className="min-h-100 h-full overflow-y-auto">
            <div className="flex flex-col gap-4">
              <MilestoneTasksInfiniteList
                projectId={projectId}
                tasks={tasks}
                setTasks={setTasks}
                initialHasNextPage={tasksMetadata.hasNextPage}
              />
            </div>
          </div>
        </div>
        <Separator orientation="vertical" />
        <div className="w-full flex flex-col gap-4 flex-1">
          <MilestonesFilters projectId={projectId} />
          <MilestonesInfiniteList
            projectId={projectId}
            initialMilestones={milestones}
            initialHasNextPage={milestonesMetadata.hasNextPage}
            tasksState={tasks}
          />
        </div>
      </div>
    </DragDropProvider>
  );
};
