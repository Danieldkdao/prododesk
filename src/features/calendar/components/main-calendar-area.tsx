"use client";

import { GetCalendarTasksActionReturnType } from "@/features/tasks/actions/actions";
import { MainCalendarDay } from "./main-calendar-day";

export const MainCalendarArea = ({
  monthDaysTasksRes,
}: {
  monthDaysTasksRes: GetCalendarTasksActionReturnType;
}) => {
  const { monthDaysTasks } = monthDaysTasksRes;

  return (
    <div className="grid grid-cols-7 auto-rows-fr flex-1 min-h-0">
      {monthDaysTasks.map(({ day, tasks }, index) => (
        <MainCalendarDay date={day} tasks={tasks} key={index} />
      ))}
    </div>
  );
};
