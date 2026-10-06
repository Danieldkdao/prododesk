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
  TaskBoardTask,
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
import { ProjectSelectType } from "@/db/schema";
import { useRouter } from "next/navigation";

export const MilestonesView = ({
  project,
  milestonesResponse,
  tasksResponse,
}: {
  project: ProjectSelectType;
  milestonesResponse: ReadProjectMilestonesActionType;
  tasksResponse: ReadTasksActionReturnType;
}) => {
  const { milestones: serverMilestones, metadata: milestonesMetadata } =
    milestonesResponse;
  const { tasks: serverTasks, metadata: tasksMetadata } = tasksResponse;
  const router = useRouter();

  const taskSavesQueueRef = useRef(new Map<string, Promise<void>>());
  const milestoneSavesQueueRef = useRef(new Map<string, Promise<void>>());
  const [milestones, setMilestones] = useState(serverMilestones);
  const [tasks, setTasks] = useState([...serverTasks]);
  const [taskOverrides, setTaskOverrides] = useState(
    new Map<string, string | null>(),
  );
  const tasksById = new Map<string, TaskBoardTask>();
  for (const milestone of milestones) {
    for (const task of milestone.tasks) {
      if (task) tasksById.set(task.id, { ...task, milestone });
    }
  }
  for (const task of tasks) tasksById.set(task.id, task);
  const allTasks = [...tasksById.values()].map((task) =>
    taskOverrides.has(task.id)
      ? {
          ...task,
          milestoneId: taskOverrides.get(task.id) ?? null,
          milestone:
            milestones.find(
              (milestone) => milestone.id === taskOverrides.get(task.id),
            ) ?? null,
        }
      : task,
  );
  const unassignedTasks = allTasks.filter((task) => !task.milestoneId);

  useEffect(() => {
    if (taskSavesQueueRef.current.size === 0) setTaskOverrides(new Map());
  }, [serverTasks, serverMilestones]);

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
          if (taskSavesQueueRef.current.get(taskId) === nextSave) {
            setTaskOverrides((current) => {
              const next = new Map(current);
              next.delete(taskId);
              return next;
            });
          }
        })
        .finally(() => {
          if (taskSavesQueueRef.current.get(taskId) === nextSave) {
            taskSavesQueueRef.current.delete(taskId);
            if (taskSavesQueueRef.current.size === 0) router.refresh();
          }
        });
    },
    [router],
  );
  const queueMilestoneReorderingSave = useCallback(
    (milestoneId: string, newPosition: number) => {
      const prevSave =
        milestoneSavesQueueRef.current.get(milestoneId) ?? Promise.resolve();

      const nextSave = prevSave
        .catch(() => {})
        .then(async () => {
          const response = await moveMilestoneAction(
            project.id,
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
    [project],
  );

  const handleTaskMilestoneUpdates = useCallback(
    (operation: DragOperation<Draggable<Data>, Droppable<Data>>) => {
      const { source, target } = operation;
      if (!source?.id || !target?.id) return;

      const sourceTask = allTasks.find((task) => task.id === source.id);
      if (
        !sourceTask ||
        sourceTask.milestoneId === target.id ||
        typeof target.id !== "string"
      )
        return;

      const newMilestoneId =
        target.id === MILESTONE_ID_NULL ? null : (target.id as string);
      if (sourceTask.milestoneId === newMilestoneId) return;
      if (
        newMilestoneId &&
        !milestones.some((milestone) => milestone.id === newMilestoneId)
      )
        return;
      flushSync(() =>
        setTaskOverrides((current) =>
          new Map(current).set(sourceTask.id, newMilestoneId),
        ),
      );
      queueTaskMilestoneSave(sourceTask.id, newMilestoneId);
    },
    [queueTaskMilestoneSave, allTasks, milestones],
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
            <TasksFilters defaultProject={project} onlySearch />
          </div>
          <MilestoneTasksInfiniteList
            projectId={project.id}
            tasks={unassignedTasks}
            setTasks={setTasks}
            initialHasNextPage={tasksMetadata.hasNextPage}
            resetKey={tasksMetadata.clientKey}
          />
        </div>
        <Separator orientation="vertical" />
        <div className="w-full flex flex-col gap-4 flex-1">
          <MilestonesFilters projectId={project.id} />
          <MilestonesInfiniteList
            projectId={project.id}
            milestones={milestones}
            setMilestones={setMilestones}
            initialHasNextPage={milestonesMetadata.hasNextPage}
            tasksState={allTasks}
            resetKey={milestonesMetadata.clientKey}
          />
        </div>
      </div>
    </DragDropProvider>
  );
};
