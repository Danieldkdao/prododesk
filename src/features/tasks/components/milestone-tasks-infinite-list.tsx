"use client";

import { NotFound } from "@/components/not-found";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { Loader2Icon } from "lucide-react";
import { useCallback } from "react";
import { readTasksAction, ReadTasksActionReturnType } from "../actions/actions";
import { useTasksParams } from "../hooks/use-tasks-params";
import { defaultDayTasksParamsOptions } from "../lib/tasks-params";
import { TaskBoardItem } from "./task-board-item";
import { SetterType } from "@/lib/types";

export const MilestoneTasksInfiniteList = ({
  projectId,
  tasks,
  setTasks,
  initialHasNextPage,
}: {
  projectId: string;
  tasks: ReadTasksActionReturnType["tasks"];
  setTasks: SetterType<ReadTasksActionReturnType["tasks"]>;
  initialHasNextPage: boolean;
}) => {
  const [filters] = useTasksParams();

  const fetchTasks = useCallback(
    (nextPage: number) => {
      return readTasksAction(null, [projectId], {
        ...defaultDayTasksParamsOptions,
        search: filters.search,
        page: nextPage,
      });
    },
    [projectId, filters],
  );

  const {
    items: tasksToUse,
    setSentinelEl,
    isPending,
  } = useInfiniteScroll<ReadTasksActionReturnType["tasks"][number], "tasks">(
    tasks,
    initialHasNextPage,
    fetchTasks,
    {
      additionalScrollDeps: [filters],
      ownState: {
        values: tasks,
        setValues: setTasks,
      },
    },
  );

  const filteredTasks = tasksToUse.filter((task) => !task.milestoneId);

  return filteredTasks.length ? (
    <div className="flex flex-col gap-2">
      {filteredTasks.map((task) => (
        <TaskBoardItem key={task.id} task={task} className="border" />
      ))}
      {isPending && (
        <div className="w-full flex items-center justify-center">
          <Loader2Icon className="text-primary animate-spin" />
        </div>
      )}
      <div ref={setSentinelEl} className="w-full h-1 bg-transparent" />
    </div>
  ) : (
    <NotFound
      title="No more tasks"
      description="We were unable to find any tasks that match the search terms provided. Try searching again with a different query."
    />
  );
};
