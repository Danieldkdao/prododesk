"use client";

import { ReadCalendarTasksActionReturnType } from "@/features/tasks/actions/actions";
import { parseISO } from "date-fns";
import { MainCalendarDay } from "./main-calendar-day";
import { TaskFormDefaultValues } from "@/features/tasks/lib/types";

export const MainCalendarArea = ({
  monthDaysTasksRes,
  project,
}: {
  monthDaysTasksRes: ReadCalendarTasksActionReturnType;
  project?: TaskFormDefaultValues["project"];
}) => {
  const { monthDaysTasks, monthKey } = monthDaysTasksRes;
  const month = parseISO(monthKey);

  return (
    <div className="grid grid-cols-7 auto-rows-fr flex-1 min-h-0">
      {monthDaysTasks.map(({ dayKey, tasks }, index) => (
        <MainCalendarDay
          month={month}
          date={parseISO(dayKey)}
          tasks={tasks}
          project={project}
          key={index}
        />
      ))}
    </div>
  );
};
