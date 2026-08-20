import { ErrorState } from "@/components/error-state";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MainCalendar } from "@/features/calendar/components/main-calendar";
import { MainCalendarSkeleton } from "@/features/calendar/components/main-calendar-skeleton";
import { loadCalendarSearchParams } from "@/features/calendar/lib/calendar-params";
import {
  getCalendarTasksAction,
  readTasksAction,
} from "@/features/tasks/actions/actions";
import { DayTasksDialog } from "@/features/tasks/components/day-tasks-dialog";
import { loadTasksSearchParams } from "@/features/tasks/lib/tasks-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { SearchParamsType } from "@/lib/types";
import { Suspense } from "react";

const DashboardCalendarPage = (props: SearchParamsType) => {
  return (
    <Suspense fallback={<DashboardCalendarLoading />}>
      <DashboardCalendarSuspense {...props} />
    </Suspense>
  );
};

const DashboardCalendarLoading = () => {
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <MainCalendarSkeleton />
    </div>
  );
};

const DashboardCalendarSuspense = async ({
  searchParams,
}: SearchParamsType) => {
  const [calendarFilters, dayTasksFilters] = await Promise.all([
    loadCalendarSearchParams(searchParams),
    loadTasksSearchParams(searchParams),
  ]);

  const [monthDaysTasks, selectedDayTasks] = await Promise.all([
    getCalendarTasksAction(calendarFilters.month),
    readTasksAction({
      ...dayTasksFilters,
      page: DEFAULT_PAGE,
      selectedDay: calendarFilters.day,
    }),
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
      <MainCalendar monthDaysTasks={monthDaysTasks} fullScreen />
      <DayTasksDialog dayTasks={selectedDayTasks} />
    </div>
  );
};

export default DashboardCalendarPage;
