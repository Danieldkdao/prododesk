"use client";

import { NotFound } from "@/components/not-found";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { DEFAULT_PAGE } from "@/lib/constants";
import { ListXIcon, Loader2Icon, PlusIcon } from "lucide-react";
import { useCallback } from "react";
import { ReadTasksActionReturnType, readTasksAction } from "../actions/actions";
import { useTasksParams } from "../hooks/use-tasks-params";
import { defaultDayTasksParamsOptions } from "../lib/tasks-params";
import { AreaProjectTaskSkeleton } from "./area-project-tasks-skeleton";
import { TaskDialog } from "./task-dialog";
import { TaskTableRow } from "./task-table-row";

export const TasksInfiniteList = ({
  initialTasks,
  initialHasNextPage,
}: {
  initialTasks: ReadTasksActionReturnType["tasks"];
  initialHasNextPage: boolean;
}) => {
  const [tasksFilters, setTasksFilters] = useTasksParams();

  const fetchTasks = useCallback(
    (nextPage: number) => {
      return readTasksAction({
        ...tasksFilters,
        page: nextPage,
      });
    },
    [tasksFilters],
  );

  const {
    items: tasks,
    page,
    setSentinelEl,
    isPending,
  } = useInfiniteScroll<ReadTasksActionReturnType["tasks"][number], "tasks">(
    initialTasks,
    initialHasNextPage,
    fetchTasks,
    {
      additionalScrollDeps: [tasksFilters],
    },
  );

  return page === DEFAULT_PAGE && !tasks.length ? (
    <NotFound
      title="No tasks yet"
      description="Create your first task to get started!"
      icon={<ListXIcon className="size-10" />}
    >
      <TaskDialog>
        <Button>
          <PlusIcon />
          Create new task
        </Button>
      </TaskDialog>
    </NotFound>
  ) : tasks.length ? (
    <div className="flex flex-col gap-2">
      {tasks.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Scheduled At</TableHead>
              <TableHead>Due At</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TaskTableRow key={task.id} task={task} showProject />
            ))}
            {isPending &&
              Array.from({ length: 8 }).map((_, index) => (
                <AreaProjectTaskSkeleton key={index} showProject />
              ))}
          </TableBody>
        </Table>
      ) : null}
      {isPending && (
        <div className="w-full flex items-center justify-center">
          <Loader2Icon className="text-primary animate-spin" />
        </div>
      )}
      <div ref={setSentinelEl} className="w-full h-1 bg-transparent" />
    </div>
  ) : (
    <NotFound
      title="Tasks not found"
      description="We were unable to find any tasks that match your selected filters. Try adjusting your filters and search terms."
    >
      <Button onClick={() => setTasksFilters(defaultDayTasksParamsOptions)}>
        Clear filters
      </Button>
    </NotFound>
  );
};
