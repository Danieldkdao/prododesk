"use client";

import { ReadCalendarTasksActionReturnType } from "@/features/tasks/actions/actions";
import { parseISO } from "date-fns";
import { MainCalendarDay } from "./main-calendar-day";

export const MainCalendarArea = ({
  monthDaysTasksRes,
}: {
  monthDaysTasksRes: ReadCalendarTasksActionReturnType;
}) => {
  const { monthDaysTasks } = monthDaysTasksRes;

  return (
    <div className="grid grid-cols-7 auto-rows-fr flex-1 min-h-0">
      {monthDaysTasks.map(({ dayKey, tasks }, index) => (
        <MainCalendarDay date={parseISO(dayKey)} tasks={tasks} key={index} />
      ))}
    </div>
  );
};
