"use client";

import { Button } from "@/components/ui/button";
import { useCalendarParams } from "@/features/calendar/hooks/use-calendar-params";
import { format } from "date-fns";
import { XIcon } from "lucide-react";
import { GetDayTasksActionReturnType } from "../actions/actions";
import { DayTasksPanelContentSkeleton } from "./day-tasks-panel-content-skeleton";
import { DayTasksPanelInfiniteCardList } from "./day-tasks-panel-infinite-list";

export const DayTasksPanelContent = ({
  dayTasks,
}: {
  dayTasks: GetDayTasksActionReturnType | null;
}) => {
  const [calendarFilters, setCalendarFilters] = useCalendarParams();

  if (!dayTasks) return <DayTasksPanelContentSkeleton />;

  const { selectedDayTasks, metadata, day } = dayTasks;

  if (
    !calendarFilters.day ||
    format(calendarFilters.day, "yyyy-MM-dd") !== day
  ) {
    return <DayTasksPanelContentSkeleton />;
  }

  const listKey = `${[...selectedDayTasks]
    .sort()
    // todo: maybe make this key more efficient in the future?
    .map(
      (task) =>
        `${task.id}${task.name}${task.description}${task.emoji}${task.startAt && task.startAt instanceof Date ? task.startAt.toISOString() : "no start at"}${task.endAt && task.endAt instanceof Date ? task.endAt.toISOString() : "no end at"}`,
    )
    .join("")} ${metadata.hasNextPage ? "yes" : "no"}`;

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
      <DayTasksPanelInfiniteCardList
        initialDayTasks={selectedDayTasks}
        initialHasNextPage={metadata.hasNextPage}
        allTasksCompleted={metadata.allTasksCompleted}
        key={listKey}
      />
    </div>
  );
};
