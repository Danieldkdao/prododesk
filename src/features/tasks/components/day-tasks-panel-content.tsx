"use client";

import { Button } from "@/components/ui/button";
import { useCalendarParams } from "@/features/calendar/hooks/use-calendar-params";
import { format } from "date-fns";
import { XIcon } from "lucide-react";
import { ReadTasksActionReturnType } from "../actions/actions";
import { DayTasksPanelContentSkeleton } from "./day-tasks-panel-content-skeleton";
import { DayTasksPanelInfiniteList } from "./day-tasks-panel-infinite-list";

export const DayTasksPanelContent = ({
  dayTasks,
}: {
  dayTasks: ReadTasksActionReturnType | null;
}) => {
  const [calendarFilters, setCalendarFilters] = useCalendarParams();

  if (!dayTasks) return <DayTasksPanelContentSkeleton />;

  const { tasks: selectedDayTasks, metadata } = dayTasks;

  if (
    !calendarFilters.day ||
    format(calendarFilters.day, "yyyy-MM-dd") !== metadata.day
  ) {
    return <DayTasksPanelContentSkeleton />;
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 px-2 h-10 flex items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold">
          {format(calendarFilters.day, "PPP")}
        </h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCalendarFilters({ day: null })}
        >
          <XIcon />
        </Button>
      </div>
      <DayTasksPanelInfiniteList
        initialDayTasks={selectedDayTasks}
        initialHasNextPage={metadata.hasNextPage}
        allTasksCompleted={metadata.allTasksCompleted}
        key={metadata.clientKey}
      />
    </div>
  );
};
