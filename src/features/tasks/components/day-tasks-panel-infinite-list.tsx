"use client";

import { NotFound } from "@/components/not-found";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCalendarParams } from "@/features/calendar/hooks/use-calendar-params";
import { calculateCalendarDayTasksValues } from "@/features/calendar/lib/utils";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { DEFAULT_PAGE } from "@/lib/constants";
import {
  CheckCircle2Icon,
  ListXIcon,
  Loader2Icon,
  PlusIcon,
} from "lucide-react";
import { ReadTasksActionReturnType, readTasksAction } from "../actions/actions";
import { useTasksParams } from "../hooks/use-tasks-params";
import { defaultDayTasksParamsOptions } from "../lib/tasks-params";
import { TasksFilters } from "./tasks-filters";
import { Task } from "./task";
import { TaskDialog } from "./task-dialog";
import { useCallback } from "react";

export const DayTasksPanelInfiniteList = ({
  initialDayTasks,
  initialHasNextPage,
  allTasksCompleted,
}: {
  initialDayTasks: ReadTasksActionReturnType["tasks"];
  initialHasNextPage: boolean;
  allTasksCompleted: boolean;
}) => {
  const [calendarFilters] = useCalendarParams();
  const [dayTasksFilters, setDayTasksFilters] = useTasksParams();

  const fetchTasks = useCallback(
    (nextPage: number) => {
      return readTasksAction(calendarFilters.day, [], {
        ...dayTasksFilters,
        page: nextPage,
      });
    },
    [calendarFilters.day, dayTasksFilters],
  );

  const {
    items: dayTasks,
    page,
    setContainerEl,
    setSentinelEl,
    isPending,
  } = useInfiniteScroll<ReadTasksActionReturnType["tasks"][number], "tasks">(
    initialDayTasks,
    initialHasNextPage,
    fetchTasks,
    {
      additionalScrollDeps: [dayTasksFilters, calendarFilters],
    },
  );

  if (!calendarFilters.day) return null;

  const { isPastDay, isToday } = calculateCalendarDayTasksValues(
    calendarFilters.month,
    calendarFilters.day,
    dayTasks,
  );

  const noFiltersApplied =
    !dayTasksFilters.search.trim() &&
    !dayTasksFilters.priorities.length &&
    !dayTasksFilters.statuses.length &&
    !dayTasksFilters.dateTimeEndRange &&
    !dayTasksFilters.dateTimeStartRange;

  return page === DEFAULT_PAGE && !dayTasks.length && noFiltersApplied ? (
    <NotFound
      title={isPastDay ? "No tasks found" : "No tasks yet"}
      description={
        isPastDay
          ? "We weren't able to find any tasks made this day."
          : "Create your first task to get started!"
      }
      icon={<ListXIcon className="size-10" />}
    >
      {!isPastDay && (
        <TaskDialog defaultValues={{ day: calendarFilters.day }}>
          <Button>
            <PlusIcon />
            Create new task
          </Button>
        </TaskDialog>
      )}
    </NotFound>
  ) : (
    <div className="flex flex-col gap-2 flex-1 min-h-0 w-full p-2">
      <TasksFilters />
      {dayTasks.length ? (
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
                {isToday
                  ? "You completed all of your tasks for today! Amazing!"
                  : "You completed all of your tasks this day! Amazing!"}
              </AlertDescription>
            </Alert>
          )}
          {dayTasks.map((task, index) => (
            <Task key={task.id} task={task} index={index} />
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
          <Button
            onClick={() => setDayTasksFilters(defaultDayTasksParamsOptions)}
          >
            Clear filters
          </Button>
        </NotFound>
      )}
    </div>
  );
};
