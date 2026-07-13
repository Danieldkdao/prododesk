"use client";

import { GetCalendarTasksActionReturnType } from "@/features/tasks/actions/actions";
import { addMonths, format } from "date-fns";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useCalendarParams } from "../hooks/use-calendar-params";
import { calculateCalendarValues } from "../lib/utils";
import { MainCalendarArea } from "./main-calendar-area";
import { MainCalendarSkeleton } from "./main-calendar-skeleton";

export const MainCalendar = ({
  monthDaysTasks,
}: {
  monthDaysTasks: GetCalendarTasksActionReturnType;
}) => {
  const [filters, setFilters] = useCalendarParams();

  const { weekDays } = calculateCalendarValues(filters.month);

  if (
    format(monthDaysTasks.month, "yyyy-MM-dd") !==
    format(filters.month, "yyyy-MM-dd")
  ) {
    return <MainCalendarSkeleton />;
  }

  const changeDateToUse = (amount: 1 | -1) =>
    setFilters({ month: addMonths(filters.month, amount) });

  return (
    <div className="h-full min-h-0 overflow-hidden w-full flex flex-col">
      <div className="shrink-0 flex flex-col">
        <div className="flex items-center gap-2 justify-between pl-2 border-b">
          <h2 className="text-2xl font-medium">
            {format(filters.month, "MMMM yyyy")}
          </h2>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeDateToUse(-1)}
              className="border-none"
            >
              <ArrowLeftIcon />
            </Button>
            <Button
              variant="ghost"
              onClick={() => changeDateToUse(1)}
              size="icon"
              className="border-none"
            >
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className="p-2 border-x border-b flex justify-center"
            >
              <span className="text-center font-medium">
                {format(day, "EEEE")}
              </span>
            </div>
          ))}
        </div>
      </div>
      <MainCalendarArea monthDaysTasksRes={monthDaysTasks} />
    </div>
  );
};
