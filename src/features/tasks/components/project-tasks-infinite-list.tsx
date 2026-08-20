"use client";

import { NotFound } from "@/components/not-found";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectSelectType } from "@/db/schema";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { DEFAULT_PAGE } from "@/lib/constants";
import {
  CheckCircle2Icon,
  ListXIcon,
  Loader2Icon,
  PlusIcon,
} from "lucide-react";
import { useCallback } from "react";
import { ReadTasksActionReturnType, readTasksAction } from "../actions/actions";
import { useTasksParams } from "../hooks/use-tasks-params";
import { defaultDayTasksParamsOptions } from "../lib/tasks-params";
import { AreaProjectTaskSkeleton } from "./area-project-tasks-skeleton";
import { TaskDialog } from "./task-dialog";
import { TaskTableRow } from "./task-table-row";

export const ProjectTasksInfiniteList = ({
  project,
  initialTasks,
  initialHasNextPage,
  allTasksCompleted,
}: {
  project: ProjectSelectType;
  initialTasks: ReadTasksActionReturnType["tasks"];
  initialHasNextPage: boolean;
  allTasksCompleted: boolean;
}) => {
  const [tasksFilters, setTasksFilters] = useTasksParams();

  const fetchTasks = useCallback(
    (nextPage: number) => {
      return readTasksAction({
        ...tasksFilters,
        page: nextPage,
        projectIds: [project.id],
      });
    },
    [tasksFilters, project.id],
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

  const noFiltersApplied =
    !tasksFilters.search.trim() &&
    !tasksFilters.priorities.length &&
    !tasksFilters.statuses.length &&
    !tasksFilters.dateTimeEndRange &&
    !tasksFilters.dateTimeStartRange;

  return page === DEFAULT_PAGE && !tasks.length && noFiltersApplied ? (
    <NotFound
      title="No tasks yet"
      description="Create your first task for this project to get started!"
      icon={<ListXIcon className="size-10" />}
    >
      <TaskDialog defaultValues={{ project }}>
        <Button>
          <PlusIcon />
          Create new task
        </Button>
      </TaskDialog>
    </NotFound>
  ) : tasks.length ? (
    <div className="flex flex-col gap-2">
      {allTasksCompleted && (
        <Alert
          variant="success"
          className="shadow-sm animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <CheckCircle2Icon className="size-6" />
          <AlertTitle>All tasks complete!</AlertTitle>
          <AlertDescription>
            You have finished all tasks for this project! Amazing work!
          </AlertDescription>
        </Alert>
      )}
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TaskTableRow key={task.id} task={task} />
            ))}
            {isPending &&
              Array.from({ length: 8 }).map((_, index) => (
                <AreaProjectTaskSkeleton key={index} />
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
