"use client";

import { NotFound } from "@/components/not-found";
import {
  CheckCircle2Icon,
  ListXIcon,
  Loader2Icon,
  PlusIcon,
} from "lucide-react";
import { TaskDialog } from "./task-dialog";
import { Button } from "@/components/ui/button";
import { TasksFilters } from "./tasks-filters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { defaultDayTasksParamsOptions } from "../lib/tasks-params";
import { useTasksParams } from "../hooks/use-tasks-params";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { GetTasksActionReturnType, getTasksAction } from "../actions/actions";
import { DEFAULT_PAGE } from "@/lib/constants";
import { Task } from "./task";
import { useCallback } from "react";
import { ProjectSelectType } from "@/db/schema";

export const ProjectTasksInfiniteList = ({
  project,
  initialTasks,
  initialHasNextPage,
  allTasksCompleted,
}: {
  project: ProjectSelectType;
  initialTasks: GetTasksActionReturnType["tasks"];
  initialHasNextPage: boolean;
  allTasksCompleted: boolean;
}) => {
  const [tasksFilters, setTasksFilters] = useTasksParams();

  const fetchTasks = useCallback(
    (nextPage: number) => {
      return getTasksAction(null, [project.id], {
        ...tasksFilters,
        page: nextPage,
      });
    },
    [tasksFilters, project.id],
  );

  const {
    items: tasks,
    page,
    setContainerEl,
    setSentinelEl,
    isPending,
  } = useInfiniteScroll<GetTasksActionReturnType["tasks"][number], "tasks">(
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
      <TaskDialog defaultProject={project}>
        <Button>
          <PlusIcon />
          Create new task
        </Button>
      </TaskDialog>
    </NotFound>
  ) : (
    <div className="flex flex-col gap-2 flex-1 min-h-0 w-full">
      <TasksFilters defaultProject={project} />
      {tasks.length ? (
        <div
          ref={setContainerEl}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain flex flex-col gap-2"
        >
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
          {tasks.map((task, index) => (
            <Task key={task.id} task={task} includeDay index={index} />
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
          title="Tasks not found"
          description="We were unable to find any tasks that match your selected filters. Try adjusting your filters and search terms."
        >
          <Button onClick={() => setTasksFilters(defaultDayTasksParamsOptions)}>
            Clear filters
          </Button>
        </NotFound>
      )}
    </div>
  );
};
