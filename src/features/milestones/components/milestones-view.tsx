"use client";

import { MilestoneTasksInfiniteList } from "@/features/tasks/components/milestone-tasks-infinite-list";
import { TasksFilters } from "@/features/tasks/components/tasks-filters";
import { MilestonesFilters } from "./milestones-filters";
import { Separator } from "@/components/ui/separator";
import { MilestonesInfiniteList } from "./milestones-infinite-list";
import {
  moveMilestoneAction,
  ReadProjectMilestonesActionType,
} from "../actions/actions";
import {
  ReadTasksActionReturnType,
  updateTaskMilestoneAction,
} from "@/features/tasks/actions/actions";
import { DragDropProvider } from "@dnd-kit/react";
import { Data, DragOperation } from "@dnd-kit/abstract";
import { Draggable, Droppable } from "@dnd-kit/dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { MILESTONE_ID_NULL } from "../lib/constants";
import { isSortableOperation } from "@dnd-kit/react/sortable";

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

  const taskSavesQueueRef = useRef(new Map<string, Promise<void>>());
  const milestoneSavesQueueRef = useRef(new Map<string, Promise<void>>());
  const [milestones, setMilestones] = useState(serverMilestones);
  const [tasks, setTasks] = useState(serverTasks);

  useEffect(() => {
    setMilestones(serverMilestones);
  }, [serverMilestones]);

  useEffect(() => {
    setTasks(serverTasks);
  }, [serverTasks]);

  const moveItem = <T,>(items: T[], from: number, to: number) => {
    const nextItems = [...items];
    const [movedItem] = nextItems.splice(from, 1);
    if (!movedItem) return items;

    nextItems.splice(to, 0, movedItem);

    return nextItems;
  };

  const queueTaskMilestoneSave = useCallback(
    (taskId: string, milestoneId: string | null) => {
      const prevSave =
        taskSavesQueueRef.current.get(taskId) ?? Promise.resolve();

      const nextSave = prevSave
        .catch(() => {})
        .then(async () => {
          const response = await updateTaskMilestoneAction(taskId, milestoneId);
          if (response.error)
            throw new Error("Failed to update task milestone.");
        });

      taskSavesQueueRef.current.set(taskId, nextSave);

      void nextSave
        .catch((error) => {
          console.error(error);
          toast.error("Failed to update task milestone.");
        })
        .finally(() => {
          if (taskSavesQueueRef.current.get(taskId) === nextSave) {
            taskSavesQueueRef.current.delete(taskId);
          }
        });
    },
    [],
  );
  const queueMilestoneReorderingSave = useCallback(
    (milestoneId: string, newPosition: number) => {
      const prevSave =
        milestoneSavesQueueRef.current.get(milestoneId) ?? Promise.resolve();

      const nextSave = prevSave
        .catch(() => {})
        .then(async () => {
          const response = await moveMilestoneAction(
            projectId,
            milestoneId,
            newPosition,
          );
          if (response.error) throw new Error("Failed to reorder milestones.");
        });

      milestoneSavesQueueRef.current.set(milestoneId, nextSave);

      void nextSave
        .catch((error) => {
          console.error(error);
          toast.error("Failed to reorder milestones.");
        })
        .finally(() => {
          if (milestoneSavesQueueRef.current.get(milestoneId) === nextSave) {
            milestoneSavesQueueRef.current.delete(milestoneId);
          }
        });
    },
    [projectId],
  );

  const handleTaskMilestoneUpdates = useCallback(
    (operation: DragOperation<Draggable<Data>, Droppable<Data>>) => {
      const { source, target } = operation;
      if (!source?.id || !target?.id) return;

      const sourceTask = tasks.find((task) => task.id === source.id);
      if (
        !sourceTask ||
        sourceTask.milestoneId === target.id ||
        typeof target.id !== "string"
      )
        return;

      const newMilestoneId =
        target.id === MILESTONE_ID_NULL ? null : (target.id as string);
      let wasUpdated = false;

      flushSync(() =>
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id === source.id && task.milestoneId !== newMilestoneId) {
              wasUpdated = true;
              return {
                ...task,
                milestoneId: newMilestoneId,
              };
            }

            return task;
          }),
        ),
      );

      if (wasUpdated) {
        queueTaskMilestoneSave(sourceTask.id, newMilestoneId);
      }
    },
    [queueTaskMilestoneSave, tasks],
  );

  const handleMilestoneOrdering = useCallback(
    (operation: DragOperation<Draggable<Data>, Droppable<Data>>) => {
      if (!isSortableOperation(operation)) return;

      const { source } = operation;
      if (!source?.id) return;

      const existingMilestone = milestones.find(
        (milestone) => milestone.id === source.id,
      );
      if (!existingMilestone) return;

      const { initialIndex, index } = source;
      if (initialIndex === index) return;

      flushSync(() =>
        setMilestones((prev) => moveItem(prev, initialIndex, index)),
      );

      queueMilestoneReorderingSave(existingMilestone.id, index + 1);
    },
    [queueMilestoneReorderingSave, milestones],
  );

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;

        const { source } = event.operation;

        if (source?.type === "task") {
          handleTaskMilestoneUpdates(event.operation);
        }
        if (source?.type === "milestone") {
          handleMilestoneOrdering(event.operation);
        }
      }}
    >
      <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 w-full">
        <div className="flex w-full min-w-0 flex-col gap-4 lg:h-[calc(100dvh-12rem)] lg:max-w-100">
          <div className="hidden lg:block">
            <TasksFilters onlySearch />
          </div>
          <MilestoneTasksInfiniteList
            projectId={projectId}
            tasks={tasks}
            setTasks={setTasks}
            initialHasNextPage={tasksMetadata.hasNextPage}
            resetKey={tasksMetadata.clientKey}
          />
        </div>
        <Separator orientation="vertical" />
        <div className="w-full flex flex-col gap-4 flex-1">
          <MilestonesFilters projectId={projectId} />
          <MilestonesInfiniteList
            projectId={projectId}
            milestones={milestones}
            setMilestones={setMilestones}
            initialHasNextPage={milestonesMetadata.hasNextPage}
            tasksState={tasks}
            resetKey={milestonesMetadata.clientKey}
          />
        </div>
      </div>
    </DragDropProvider>
  );
};
