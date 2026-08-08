"use client";

import { NotFound } from "@/components/not-found";
import { MILESTONE_ID_NULL } from "@/features/milestones/lib/constants";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { SetterType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/react";
import { Loader2Icon } from "lucide-react";
import { useCallback } from "react";
import { readTasksAction, ReadTasksActionReturnType } from "../actions/actions";
import { useTasksParams } from "../hooks/use-tasks-params";
import { defaultDayTasksParamsOptions } from "../lib/tasks-params";
import { TaskBoardItem } from "./task-board-item";

export const MilestoneTasksInfiniteList = ({
  projectId,
  tasks,
  setTasks,
  initialHasNextPage,
  resetKey,
}: {
  projectId: string;
  tasks: ReadTasksActionReturnType["tasks"];
  setTasks: SetterType<ReadTasksActionReturnType["tasks"]>;
  initialHasNextPage: boolean;
  resetKey: string;
}) => {
  const { ref, isDropTarget } = useDroppable({
    id: MILESTONE_ID_NULL,
    type: "backlog",
    accept: "task",
  });
  const [filters] = useTasksParams();

  const fetchTasks = useCallback(
    (nextPage: number) => {
      return readTasksAction(null, [projectId], {
        ...defaultDayTasksParamsOptions,
        search: filters.search,
        page: nextPage,
        unassignedOnly: true,
      });
    },
    [projectId, filters.search],
  );

  const {
    items: tasksToUse,
    setSentinelEl,
    setContainerEl,
    isPending,
    hasNextPage,
  } = useInfiniteScroll<ReadTasksActionReturnType["tasks"][number], "tasks">(
    tasks,
    initialHasNextPage,
    fetchTasks,
    {
      rootMargin: "0px 400px 400px 0px",
      additionalScrollDeps: [filters],
      resetKey,
      ownState: {
        values: tasks,
        setValues: setTasks,
      },
    },
  );

  return (
    <div
      ref={setContainerEl}
      className="min-w-0 overflow-x-auto lg:min-h-0 lg:flex-1 lg:overflow-x-hidden lg:overflow-y-auto"
    >
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-2 transition-colors duration-200 lg:w-full lg:flex-1",
          isDropTarget && "ring-1 ring-primary",
        )}
      >
        <div className="flex flex-row lg:flex-col gap-2">
          {tasksToUse.map((task) => (
            <TaskBoardItem
              key={task.id}
              task={task}
              minimizeSmallScreens
              className="w-72 shrink-0 border lg:w-full"
            />
          ))}
          {isPending && (
            <div className="flex items-center justify-center w-full">
              <Loader2Icon className="text-primary animate-spin" />
            </div>
          )}
          <div
            ref={setSentinelEl}
            className="w-px shrink-0 self-stretch lg:h-px lg:w-full"
          />
        </div>
        {!tasksToUse.length && !isPending && !hasNextPage && (
          <NotFound
            title="No more tasks"
            description="We were unable to find any tasks that match the search terms provided. Try searching again with a different query."
          />
        )}
      </div>
    </div>
  );
};
