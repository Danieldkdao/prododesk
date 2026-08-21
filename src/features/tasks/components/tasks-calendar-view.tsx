import { ErrorState } from "@/components/error-state";
import { MainCalendar } from "@/features/calendar/components/main-calendar";
import { MainCalendarSkeleton } from "@/features/calendar/components/main-calendar-skeleton";
import { loadCalendarSearchParams } from "@/features/calendar/lib/calendar-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";
import { readCalendarTasksAction, readTasksAction } from "../actions/actions";
import { loadTasksSearchParams } from "../lib/tasks-params";
import { DayTasksDialog } from "./day-tasks-dialog";

type TasksCalendarViewProps = {
  params?: Promise<
    Partial<Awaited<ParamsId<"areaId" | "projectId">["params"]>>
  >;
} & SearchParamsType;

export const TasksCalendarView = (props: TasksCalendarViewProps) => {
  return (
    <Suspense fallback={<TasksCalendarViewLoading />}>
      <TasksCalendarViewSuspense {...props} />
    </Suspense>
  );
};

const TasksCalendarViewLoading = () => {
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <MainCalendarSkeleton fixedHeight />
    </div>
  );
};

const TasksCalendarViewSuspense = async ({
  params,
  searchParams,
}: TasksCalendarViewProps) => {
  const projectId = params ? (await params).projectId : undefined;
  const areaId = params ? (await params).areaId : undefined;

  const [calendarFilters, dayTasksFilters] = await Promise.all([
    loadCalendarSearchParams(searchParams),
    loadTasksSearchParams(searchParams),
  ]);

  const projectIds = projectId ? [projectId] : undefined;
  const areaIds = areaId ? [areaId] : undefined;

  const readOptions = {
    areaIds,
    projectIds,
  };

  const [monthDaysTasks, selectedDayTasks] = await Promise.all([
    readCalendarTasksAction({
      month: calendarFilters.month,
      view: calendarFilters.view,
      search: dayTasksFilters.search,
      statuses: dayTasksFilters.statuses,
      priorities: dayTasksFilters.priorities,
      ...readOptions,
    }),
    calendarFilters.day
      ? readTasksAction({
          ...dayTasksFilters,
          page: DEFAULT_PAGE,
          selectedDay: calendarFilters.day,
          ...readOptions,
        })
      : Promise.resolve(null),
  ]);

  if (!monthDaysTasks) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your calendar. Try refreshing the page or check back later if the issue persists."
      />
    );
  }

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <MainCalendar monthDaysTasks={monthDaysTasks} />
      <DayTasksDialog dayTasks={selectedDayTasks} readOptions={readOptions} />
    </div>
  );
};
