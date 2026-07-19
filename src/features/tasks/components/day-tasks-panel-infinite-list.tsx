"use client";

import { NotFound } from "@/components/not-found";
import { Button } from "@/components/ui/button";
import { TaskTableSelectType } from "@/db/schema";
import { useCalendarParams } from "@/features/calendar/hooks/use-calendar-params";
import { calculateCalendarDayTasksValues } from "@/features/calendar/lib/utils";
import { DEFAULT_PAGE } from "@/lib/constants";
import {
  CheckCircle2Icon,
  ListXIcon,
  Loader2Icon,
  PlusIcon,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { getDayTasksAction } from "../actions/actions";
import { useDayTasksParams } from "../hooks/use-day-tasks-params";
import { DayTasksPanelFilters } from "./day-tasks-panel-filters";
import { Task } from "./task";
import { TaskDialog } from "./task-dialog";
import { defaultDayTasksParamsOptions } from "../lib/day-tasks-params";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthSession } from "@/hooks/use-auth-session";

export const DayTasksPanelInfiniteCardList = ({
  initialDayTasks,
  initialHasNextPage,
  allTasksCompleted,
}: {
  initialDayTasks: TaskTableSelectType[];
  initialHasNextPage: boolean;
  allTasksCompleted: boolean;
}) => {
  const { data: session } = useAuthSession();
  const [calendarFilters] = useCalendarParams();
  const [dayTasksFilters, setDayTasksFilters] = useDayTasksParams();

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [dayTasks, setDayTasks] = useState(initialDayTasks);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (
      !sentinel ||
      isPending ||
      !hasNextPage ||
      !calendarFilters.day ||
      !session?.user.id
    )
      return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        startTransition(async () => {
          const nextPage = page + 1;

          const response = await getDayTasksAction(
            session.user.id,
            calendarFilters.day,
            {
              ...dayTasksFilters,
              page: nextPage,
            },
          );
          if (!response) return;

          const { selectedDayTasks, metadata } = response;

          setDayTasks((prev) => [...prev, ...selectedDayTasks]);
          setPage(nextPage);
          setHasNextPage(metadata.hasNextPage);
        });
      },
      {
        root: containerRef.current,
        rootMargin: "400px",
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [
    dayTasksFilters,
    calendarFilters,
    page,
    hasNextPage,
    isPending,
    dayTasks,
    setDayTasks,
    session?.user.id,
  ]);

  if (!calendarFilters.day) return null;

  const { isPastDay, isToday } = calculateCalendarDayTasksValues(
    calendarFilters.month,
    calendarFilters.day,
    dayTasks,
  );

  const noFiltersApplied =
    !dayTasksFilters.search.trim() &&
    !dayTasksFilters.priorities.length &&
    dayTasksFilters.schedule === "any" &&
    dayTasksFilters.status === "all" &&
    !dayTasksFilters.timeEndRange &&
    !dayTasksFilters.timeStartRange;

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
        <TaskDialog defaultDay={calendarFilters.day}>
          <Button>
            <PlusIcon />
            Create new task
          </Button>
        </TaskDialog>
      )}
    </NotFound>
  ) : (
    <div className="flex flex-col gap-2 flex-1 min-h-0 w-full p-2">
      <DayTasksPanelFilters />
      {dayTasks.length ? (
        <div
          ref={containerRef}
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
          <div ref={sentinelRef} className="w-full h-1 bg-transparent" />
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
