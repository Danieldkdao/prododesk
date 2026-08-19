"use client";

import { ProjectSelectType, TaskSelectType } from "@/db/schema";
import { BoardProperty } from "@/features/projects/lib/types";
import { DragDropProvider } from "@dnd-kit/react";
import { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { TaskBoardColumn } from "./task-board-column";
import { TaskBoardItem } from "./task-board-item";

export const TaskBoard = <
  Property extends BoardProperty,
  PropertyOption extends TaskSelectType[Property],
>({
  initialTasks,
  project,
  property,
  propertyOptions,
  saveOnMoveEnd,
  formatter,
}: {
  initialTasks: TaskSelectType[];
  project?: ProjectSelectType;
  property: Property;
  propertyOptions: readonly PropertyOption[];
  saveOnMoveEnd: (
    taskId: string,
    property: PropertyOption,
  ) => Promise<{ error: boolean; message: string }>;
  formatter: (option: PropertyOption) => {
    label: string;
    icon: LucideIcon;
    textColor: string;
  };
}) => {
  const savesQueuesRef = useRef(new Map<string, Promise<void>>());
  const [tasks, setTasks] = useState(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const queueTaskPropertySave = useCallback(
    (taskId: string, newProperty: PropertyOption) => {
      const prevSave = savesQueuesRef.current.get(taskId) ?? Promise.resolve();

      const nextSave = prevSave
        .catch(() => {})
        .then(async () => {
          const response = await saveOnMoveEnd(taskId, newProperty);

          if (response.error)
            throw new Error("Failed to update task properties.");
        });

      savesQueuesRef.current.set(taskId, nextSave);

      void nextSave
        .catch((error) => {
          console.error(error);
          toast.error("Unable to save task properties.");
        })
        .finally(() => {
          if (savesQueuesRef.current.get(taskId) === nextSave) {
            savesQueuesRef.current.delete(taskId);
          }
        });
    },
    [saveOnMoveEnd],
  );

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;

        const { source, target } = event.operation;

        if (!source?.id || !target?.id) return;

        const sourceTask = tasks.find((task) => task.id === source.id);
        if (!sourceTask || sourceTask[property] === target.id) return;

        flushSync(() =>
          setTasks((prev) =>
            prev.map((task) => {
              if (task.id === source.id && task[property] !== target.id)
                return { ...task, [property]: target.id as Property };
              return task;
            }),
          ),
        );

        queueTaskPropertySave(sourceTask.id, target.id as PropertyOption);
      }}
    >
      <div className="overflow-auto min-w-0 w-full">
        <div className="w-full grid grid-cols-4 gap-4 min-w-300">
          {propertyOptions.map((propertyOption) => {
            const statusTasks = tasks.filter(
              (task) => task[property] === propertyOption,
            );

            return (
              <TaskBoardColumn
                key={propertyOption}
                property={property}
                propertyValue={propertyOption}
                project={project}
                formatter={formatter}
              >
                {statusTasks.map((task) => (
                  <TaskBoardItem
                    key={task.id}
                    task={{ ...task, project }}
                    property={property}
                  />
                ))}
              </TaskBoardColumn>
            );
          })}
        </div>
      </div>
    </DragDropProvider>
  );
};
