"use client";

import { ProjectSelectType, TaskSelectType } from "@/db/schema";
import { TaskStatus, taskStatuses } from "@/db/shared";
import { DragDropProvider } from "@dnd-kit/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { updateTaskStatusAction } from "../actions/actions";
import { TaskBoardColumn } from "./task-board-column";
import { TaskBoardItem } from "./task-board-item";

export const ProjectTaskBoard = ({
  initialTasks,
  project,
}: {
  initialTasks: TaskSelectType[];
  project: ProjectSelectType;
}) => {
  const savesQueuesRef = useRef(new Map<string, Promise<void>>());
  const [tasks, setTasks] = useState(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

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

        if (!source?.id || !target?.id) return;

        const sourceTask = tasks.find((task) => task.id === source.id);
        if (!sourceTask || sourceTask.status === target.id) return;

        flushSync(() =>
          setTasks((prev) =>
            prev.map((task) => {
              if (task.id === source.id && task.status !== target.id)
                return { ...task, status: target.id as TaskStatus };
              return task;
            }),
          ),
        );

        queueStatusSave(sourceTask.id, target.id as TaskStatus);
      }}
    >
      <div className="w-full grid grid-cols-4 gap-4">
        {taskStatuses.map((status) => {
          const statusTasks = tasks.filter((task) => task.status === status);

          return (
            <TaskBoardColumn key={status} project={project} status={status}>
              {statusTasks.map((task) => (
                <TaskBoardItem key={task.id} task={{ ...task, project }} />
              ))}
            </TaskBoardColumn>
          );
        })}
      </div>
    </DragDropProvider>
  );
};
