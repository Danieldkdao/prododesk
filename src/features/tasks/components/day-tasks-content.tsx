"use client";

import { Button } from "@/components/ui/button";
import { useCalendarParams } from "@/features/calendar/hooks/use-calendar-params";
import { format } from "date-fns";
import { XIcon } from "lucide-react";
import { ReadTasksActionReturnType } from "../actions/actions";
import { DayTasksContentSkeleton } from "./day-tasks-content-skeleton";
import { DayTasksInfiniteList } from "./day-tasks-infinite-list";

export const DayTasksContent = ({
  dayTasks,
  readOptions,
}: {
  dayTasks: ReadTasksActionReturnType | null;
  readOptions?: {
    areaIds?: string[] | undefined;
    projectIds?: string[] | undefined;
  };
}) => {
  const [calendarFilters, setCalendarFilters] = useCalendarParams();

  if (!dayTasks) return <DayTasksContentSkeleton />;

  const { tasks: selectedDayTasks, metadata } = dayTasks;

  if (
    !calendarFilters.day ||
    format(calendarFilters.day, "yyyy-MM-dd") !== metadata.day
  ) {
    return <DayTasksContentSkeleton />;
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-4 overflow-hidden">
      <div className="shrink-0 h-10 flex items-center justify-between gap-2">
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
      <DayTasksInfiniteList
        initialDayTasks={selectedDayTasks}
        initialHasNextPage={metadata.hasNextPage}
        allTasksCompleted={metadata.allTasksCompleted}
        readOptions={readOptions}
        key={metadata.clientKey}
      />
    </div>
  );
};
