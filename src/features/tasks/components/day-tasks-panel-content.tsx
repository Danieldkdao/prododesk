"use client";

import { useCalendarParams } from "@/features/calendar/hooks/use-calendar-params";
import { format } from "date-fns";
import { GetCalendarTasksActionReturnType } from "../actions/actions";
import { Task } from "./task";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

export const DayTasksPanelContent = ({
  dayTasks,
}: {
  dayTasks: GetCalendarTasksActionReturnType["selectedDayTasks"];
}) => {
  const [filters, setFilters] = useCalendarParams();

  if (!filters.day || !dayTasks) return null;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 px-2 h-10 flex items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold">{format(filters.day, "PPP")}</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setFilters({ day: null })}
        >
          <XIcon />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 flex flex-col gap-2">
        {dayTasks.map((task) => (
          <Task key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};
