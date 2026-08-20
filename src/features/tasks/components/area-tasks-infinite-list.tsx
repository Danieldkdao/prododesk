"use client";

import { NotFound } from "@/components/not-found";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useCallback } from "react";
import { readTasksAction, ReadTasksActionReturnType } from "../actions/actions";
import { useTasksParams } from "../hooks/use-tasks-params";
import { AreaProjectTaskSkeleton } from "./area-project-tasks-skeleton";
import { TaskTableRow } from "./task-table-row";

export const AreaTasksInfiniteList = ({
  areaId,
  initialTasks,
  initialHasNextPage,
}: {
  areaId: string;
  initialTasks: ReadTasksActionReturnType["tasks"];
  initialHasNextPage: boolean;
}) => {
  const [filters] = useTasksParams();

  const fetchTasks = useCallback(
    (nextPage: number) => {
      return readTasksAction({
        ...filters,
        areaIds: [areaId],
        page: nextPage,
      });
    },
    [areaId, filters],
  );

  const {
    items: tasks,
    setSentinelEl,
    isPending,
  } = useInfiniteScroll<ReadTasksActionReturnType["tasks"][number], "tasks">(
    initialTasks,
    initialHasNextPage,
    fetchTasks,
    {
      additionalScrollDeps: [areaId, filters],
    },
  );

  return (
    <div className="w-full">
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
              <TaskTableRow key={task.id} showProject task={task} />
            ))}
            {isPending &&
              Array.from({ length: 8 }).map((_, index) => (
                <AreaProjectTaskSkeleton key={index} showProject />
              ))}
          </TableBody>
        </Table>
      ) : (
        <NotFound
          title="Tasks not found"
          description="We were unable to find any tasks that match those filters in this area. Try changing your filters or create a new task to get started."
        />
      )}

      <div ref={setSentinelEl} className="w-full h-1 bg-transparent" />
    </div>
  );
};
