import { ErrorState } from "@/components/error-state";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MainCalendar } from "@/features/calendar/components/main-calendar";
import { loadCalendarSearchParams } from "@/features/calendar/lib/calendar-params";
import { getCalendarTasksAction } from "@/features/tasks/actions/actions";
import { DayTasksPanel } from "@/features/tasks/components/day-tasks-panel";
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
  return <div>loading</div>;
};

const DashboardCalendarSuspense = async ({
  searchParams,
}: SearchParamsType) => {
  const filters = await loadCalendarSearchParams(searchParams);

  const response = await getCalendarTasksAction(filters.month, filters.day);
  if (!response) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your calendar. Try refreshing the page or check back later if the issue persists."
      />
    );
  }

  const { monthDaysTasks, selectedDayTasks } = response;

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
