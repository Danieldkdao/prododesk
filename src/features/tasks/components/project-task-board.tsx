"use client";

import { TaskSelectType } from "@/db/schema";
import { TaskStatus, taskStatuses } from "@/db/shared";
import { DragDropProvider } from "@dnd-kit/react";
import { useCallback, useRef, useState } from "react";
import { updateTaskStatusAction } from "../actions/actions";
import { isTaskStatus } from "../lib/helpers";
import { TaskBoardColumn } from "./task-board-column";
import { TaskBoardItem } from "./task-board-item";
import { toast } from "sonner";
import { flushSync } from "react-dom";

type BoardColumns = Record<TaskStatus, TaskSelectType[]>;

const boardColumns: BoardColumns = {
  backlog: [],
  completed: [],
  in_progress: [],
  not_started: [],
};

export const ProjectTaskBoard = ({
  initialTasks,
}: {
  initialTasks: TaskSelectType[];
}) => {
  const savesQueuesRef = useRef(new Map<string, Promise<void>>());
  const [tasksColumnState, setTasksColumnState] = useState<BoardColumns>(
    Object.fromEntries(
      Object.entries(boardColumns).map(([status]) => [
        status,
        initialTasks.filter((task) => task.status === status),
      ]),
    ) as BoardColumns,
  );

  const queueStatusSave = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      const prevSave = savesQueuesRef.current.get(taskId) ?? Promise.resolve();

      const nextSave = prevSave
        .catch(() => {})
        .then(async () => {
          const response = await updateTaskStatusAction(taskId, newStatus);

          if (response.error) throw new Error("Failed to update task status.");
        });

      savesQueuesRef.current.set(taskId, nextSave);

      void nextSave
        .catch((error) => {
          console.error(error);
          toast.error("Unable to save task status.");
        })
        .finally(() => {
          if (savesQueuesRef.current.get(taskId) === nextSave) {
            savesQueuesRef.current.delete(taskId);
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

        if (!source?.id || !target?.id || !isTaskStatus(target.id)) return;

        const sourceTask = Object.values(tasksColumnState)
          .flat()
          .find((task) => task.id === source.id);
        if (!sourceTask || sourceTask.status === target.id) return;

        const movedTask = {
          ...sourceTask,
          status: target.id,
        };

        flushSync(() =>
          setTasksColumnState((state) => {
            return Object.fromEntries(
              Object.entries(state).map(([status, tasks]) => {
                if (status === target.id) {
                  return [
                    status,
                    tasks.some((task) => task.id === source.id)
                      ? tasks
                      : [...tasks, movedTask],
                  ];
                }
                return [status, tasks.filter((task) => task.id !== source.id)];
              }),
            ) as BoardColumns;
          }),
        );

        queueStatusSave(sourceTask.id, target.id);
      }}
    >
      <div className="w-full grid grid-cols-4 gap-4">
        {taskStatuses.map((status) => {
          const tasks = tasksColumnState[status];

          return (
            <TaskBoardColumn key={status} status={status}>
              {tasks.map((task) => (
                <TaskBoardItem key={task.id} task={task} />
              ))}
            </TaskBoardColumn>
          );
        })}
      </div>
    </DragDropProvider>
  );
};
