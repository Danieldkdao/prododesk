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
import { useDroppable } from "@dnd-kit/react";
import { cn } from "@/lib/utils";
import { MILESTONE_ID_NULL } from "@/features/milestones/lib/constants";
import { TaskSkeleton } from "./task-skeleton";

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
  const { ref, isDropTarget } = useDroppable({
    id: MILESTONE_ID_NULL,
  });
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

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 transition-colors duration-200",
        isDropTarget && "ring-1 ring-primary",
      )}
    >
      {filteredTasks.length ? (
        <div className="flex flex-col gap-2">
          {filteredTasks.map((task) => (
            <TaskBoardItem key={task.id} task={task} className="border" />
          ))}
          {isPending &&
            Array.from({ length: 4 }).map((_, index) => (
              <TaskSkeleton key={index} />
            ))}
          <div ref={setSentinelEl} className="w-full h-1 bg-transparent" />
        </div>
      ) : (
        <NotFound
          title="No more tasks"
          description="We were unable to find any tasks that match the search terms provided. Try searching again with a different query."
        />
      )}
    </div>
  );
};
