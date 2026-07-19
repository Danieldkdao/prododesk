import { ErrorState } from "@/components/error-state";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MainCalendar } from "@/features/calendar/components/main-calendar";
import { MainCalendarSkeleton } from "@/features/calendar/components/main-calendar-skeleton";
import { loadCalendarSearchParams } from "@/features/calendar/lib/calendar-params";
import {
  getCalendarTasksAction,
  getDayTasksAction,
} from "@/features/tasks/actions/actions";
import { DayTasksPanel } from "@/features/tasks/components/day-tasks-panel";
import { loadDayTasksSearchParams } from "@/features/tasks/lib/day-tasks-params";
import { getCurrentUser } from "@/lib/auth/helpers";
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
  const { userId } = await getCurrentUser();
  if (!userId)
    return (
      <ErrorState
        title="Unauthorized"
        description="Please sign in or create a new account to continue."
      />
    );
  const [calendarFilters, dayTasksFilters] = await Promise.all([
    loadCalendarSearchParams(searchParams),
    loadDayTasksSearchParams(searchParams),
  ]);

  const [monthDaysTasks, selectedDayTasks] = await Promise.all([
    getCalendarTasksAction(userId, calendarFilters.month),
    getDayTasksAction(userId, calendarFilters.day, {
      ...dayTasksFilters,
      page: DEFAULT_PAGE,
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
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel minSize="65%" className="min-h-0 overflow-hidden">
          <MainCalendar monthDaysTasks={monthDaysTasks} />
        </ResizablePanel>
        <DayTasksPanel dayTasks={selectedDayTasks} />
      </ResizablePanelGroup>
    </div>
  );
};

export default DashboardCalendarPage;
