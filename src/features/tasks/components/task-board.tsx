"use client";

import { ProjectSelectType, TaskSelectType } from "@/db/schema";
import { BoardProperty, TaskBoardCursor } from "@/features/tasks/lib/types";
import { DragDropProvider } from "@dnd-kit/react";
import { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import {
  readTaskBoardColumnAction,
  TaskBoardData,
  TaskBoardFilters,
  TaskBoardTask,
} from "../actions/actions";
import { TaskBoardColumn } from "./task-board-column";
import { TaskBoardItem } from "./task-board-item";

type ColumnPagination = {
  nextCursor: TaskBoardCursor | null;
  hasNextPage: boolean;
  isLoading: boolean;
  hasLoadError: boolean;
};

const getInitialTasks = (data: TaskBoardData) => {
  const tasksById = new Map<string, TaskBoardTask>();

  for (const page of Object.values(data.columns)) {
    for (const task of page?.tasks ?? []) {
      tasksById.set(task.id, task);
    }
  }

  return [...tasksById.values()];
};

const getInitialPagination = (
  data: TaskBoardData,
  propertyOptions: readonly string[],
) =>
  Object.fromEntries(
    propertyOptions.map((option) => {
      const page = data.columns[option as keyof typeof data.columns];

      return [
        option,
        {
          nextCursor: page?.nextCursor ?? null,
          hasNextPage: page?.hasNextPage ?? false,
          isLoading: false,
          hasLoadError: false,
        } satisfies ColumnPagination,
      ];
    }),
  ) as Record<string, ColumnPagination>;

export const TaskBoard = <
  Property extends BoardProperty,
  PropertyOption extends TaskSelectType[Property],
>({
  initialData,
  filters,
  project,
  property,
  propertyOptions,
  saveOnMoveEnd,
  formatter,
}: {
  initialData: TaskBoardData;
  filters: TaskBoardFilters;
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
  const loadingColumnsRef = useRef(new Set<string>());
  const localPropertyOverridesRef = useRef(new Map<string, PropertyOption>());
  const previousInitialDataRef = useRef(initialData);

  const [tasks, setTasks] = useState(getInitialTasks(initialData));
  const [pagination, setPagination] = useState(() =>
    getInitialPagination(initialData, propertyOptions),
  );

  const mergeTasks = useCallback(
    (currentTasks: TaskBoardTask[], incomingTasks: TaskBoardTask[]) => {
      const tasksById = new Map(currentTasks.map((task) => [task.id, task]));

      for (const task of incomingTasks) {
        const localProperty = localPropertyOverridesRef.current.get(task.id);

        tasksById.set(
          task.id,
          localProperty === undefined
            ? task
            : ({
                ...task,
                [property]: localProperty,
              } as TaskBoardTask),
        );
      }

      return [...tasksById.values()];
    },
    [property],
  );

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

  const loadMore = useCallback(
    async (column: PropertyOption) => {
      const columnKey = String(column);
      const columnPagination = pagination[columnKey];

      if (
        !columnPagination?.hasNextPage ||
        !columnPagination.nextCursor ||
        loadingColumnsRef.current.has(columnKey)
      )
        return;

      loadingColumnsRef.current.add(columnKey);

      setPagination((current) => ({
        ...current,
        [columnKey]: {
          ...current[columnKey],
          isLoading: true,
          hasLoadError: false,
        },
      }));

      try {
        const page = await readTaskBoardColumnAction({
          ...filters,
          property,
          column,
          cursor: columnPagination.nextCursor,
        });
        if (!page) throw new Error("Failed to load more tasks.");

        setTasks((currentTasks) => mergeTasks(currentTasks, page.tasks));
        setPagination((current) => ({
          ...current,
          [columnKey]: {
            ...current[columnKey],
            nextCursor: page.nextCursor,
            hasNextPage: page.hasNextPage,
            isLoading: false,
            hasLoadError: false,
          },
        }));
      } catch (error) {
        console.error(error);
        toast.error("Unable to load more tasks.");
        setPagination((current) => ({
          ...current,
          [columnKey]: {
            ...current[columnKey],
            isLoading: false,
            hasLoadError: true,
          },
        }));
      } finally {
        loadingColumnsRef.current.delete(columnKey);
      }
    },
    [filters, mergeTasks, pagination, property],
  );

  useEffect(() => {
    if (previousInitialDataRef.current === initialData) return;

    previousInitialDataRef.current = initialData;

    setTasks((currentTasks) =>
      mergeTasks(currentTasks, getInitialTasks(initialData)),
    );
  }, [initialData, mergeTasks]);

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;

        const { source, target } = event.operation;

        if (!source?.id || !target?.id) return;

        const sourceTask = tasks.find((task) => task.id === source.id);
        if (!sourceTask || sourceTask[property] === target.id) return;

        const nextProperty = target.id as PropertyOption;

        localPropertyOverridesRef.current.set(sourceTask.id, nextProperty);

        flushSync(() =>
          setTasks((prev) =>
            prev.map((task) => {
              if (task.id === source.id && task[property] !== target.id)
                return { ...task, [property]: nextProperty };
              return task;
            }),
          ),
        );

        queueTaskPropertySave(sourceTask.id, nextProperty);
      }}
    >
      <div className="overflow-auto min-w-0 w-full">
        <div className="w-full grid grid-cols-4 gap-4 min-w-300">
          {propertyOptions.map((propertyOption) => {
            const columnKey = String(propertyOption);
            const columnTasks = tasks.filter(
              (task) => String(task[property]) === columnKey,
            );
            const columnPagination = pagination[columnKey];

            return (
              <TaskBoardColumn
                key={propertyOption}
                property={property}
                propertyValue={propertyOption}
                project={project}
                formatter={formatter}
                hasNextPage={columnPagination?.hasNextPage ?? false}
                isLoading={columnPagination?.isLoading ?? false}
                hasLoadError={columnPagination?.hasLoadError ?? false}
                onLoadMore={() => void loadMore(propertyOption)}
              >
                {columnTasks.map((task) => (
                  <TaskBoardItem
                    key={task.id}
                    task={{
                      ...task,
                      project: project ?? task.project,
                      milestone: task.milestone,
                    }}
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
