"use client";

import { ProjectSelectType } from "@/db/schema";
import { BoardProperty, PaginationCursor } from "@/features/tasks/lib/types";
import { DragDropProvider } from "@dnd-kit/react";
import { LucideIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { createBoardStore } from "../lib/board-store";
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
  nextCursor: PaginationCursor | null;
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
  PropertyOption extends TaskBoardTask[Property],
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
  const router = useRouter();
  const loadingColumnsRef = useRef(new Set<string>());
  const snapshotGenerationRef = useRef(0);
  const [store] = useState(() =>
    createBoardStore(
      getInitialTasks(initialData),
      property,
      getInitialPagination(initialData, propertyOptions),
      (error) => {
        console.error(error);
        toast.error("Unable to save task properties.");
      },
      () => router.refresh(),
    ),
  );
  const { tasks, metadata: pagination } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  const setPagination = store.setMetadata;

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

      const generation = snapshotGenerationRef.current;
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

        if (generation !== snapshotGenerationRef.current) return;
        store.appendPage(page.tasks);
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
        if (generation !== snapshotGenerationRef.current) return;
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
        if (generation === snapshotGenerationRef.current) {
          loadingColumnsRef.current.delete(columnKey);
        }
      }
    },
    [filters, store, pagination, property, setPagination],
  );

  useEffect(() => {
    if (
      !store.replaceSnapshot(
        getInitialTasks(initialData),
        getInitialPagination(initialData, propertyOptions),
      )
    )
      return;
    snapshotGenerationRef.current++;
    loadingColumnsRef.current.clear();
  }, [initialData, propertyOptions, store]);

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;

        const { source, target } = event.operation;

        if (!source?.id || !target?.id) return;

        const sourceTask = tasks.find((task) => task.id === source.id);
        const previousProperty = sourceTask?.[property] as
          PropertyOption | undefined;
        if (!sourceTask || !previousProperty || previousProperty === target.id)
          return;

        const nextProperty = target.id as PropertyOption;

        void store.move(sourceTask.id, nextProperty, saveOnMoveEnd);
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
