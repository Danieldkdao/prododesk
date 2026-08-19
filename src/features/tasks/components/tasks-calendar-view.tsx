import { ErrorState } from "@/components/error-state";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MainCalendar } from "@/features/calendar/components/main-calendar";
import { loadCalendarSearchParams } from "@/features/calendar/lib/calendar-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { SearchParamsType } from "@/lib/types";
import { Suspense } from "react";
import { getCalendarTasksAction, readTasksAction } from "../actions/actions";
import { loadTasksSearchParams } from "../lib/tasks-params";
import { DayTasksPanel } from "./day-tasks-panel";

export const TasksCalendarView = (props: SearchParamsType) => {
  return (
    <Suspense fallback={<TasksCalendarViewLoading />}>
      <TasksCalendarViewSuspense {...props} />
    </Suspense>
  );
};

const TasksCalendarViewLoading = () => {
  return <div>loading</div>;
};

const TasksCalendarViewSuspense = async ({
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
      <div className="overflow-x-auto">
        <div className="w-full min-w-300">
          <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel minSize="65%" className="min-h-0 overflow-hidden">
              <MainCalendar monthDaysTasks={monthDaysTasks} />
            </ResizablePanel>
            <DayTasksPanel dayTasks={selectedDayTasks} />
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
};
