"use client";

import { GetCalendarTasksActionReturnType } from "@/features/tasks/actions/actions";
import { addMonths, format } from "date-fns";
import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useCalendarParams } from "../hooks/use-calendar-params";
import { calculateCalendarValues } from "../lib/utils";
import { MainCalendarArea } from "./main-calendar-area";
import { MainCalendarSkeleton } from "./main-calendar-skeleton";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export const MainCalendar = ({
  monthDaysTasks,
  fullScreen = false,
}: {
  monthDaysTasks: GetCalendarTasksActionReturnType;
  fullScreen?: boolean;
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
    <div
      className={cn(
        "h-full min-h-0 overflow-hidden w-full flex flex-col",
        !fullScreen && "gap-2",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 shrink-0 w-full py-1",
          fullScreen && "border-t border-x px-2",
        )}
      >
        <Button
          variant={fullScreen ? "ghost" : "outline"}
          size="icon-sm"
          className={cn(!fullScreen && "border-2")}
          onClick={() => changeDateToUse(-1)}
        >
          <ArrowLeftIcon />
        </Button>
        {fullScreen && <Separator orientation="vertical" />}
        <div
          className={cn(
            "flex items-center gap-2 h-9 px-2",
            !fullScreen && "border-2",
          )}
        >
          <CalendarIcon className="size-4" />
          <span className="text-base font-medium">
            {format(filters.month, "MMMM yyyy")}
          </span>
        </div>
        {fullScreen && <Separator orientation="vertical" />}
        <Button
          variant={fullScreen ? "ghost" : "outline"}
          onClick={() => changeDateToUse(1)}
          className={cn(!fullScreen && "border-2")}
          size="icon-sm"
        >
          <ArrowRightIcon />
        </Button>
      </div>
      <div className="min-h-0 overflow-hidden flex-1 flex flex-col w-full border">
        <div className="grid grid-cols-7">
          {weekDays.map((day, index) => (
            <div key={index} className="p-2 border flex justify-center">
              <span className="text-center font-medium">
                {format(day, "EEEE")}
              </span>
            </div>
          ))}
        </div>
        <MainCalendarArea monthDaysTasksRes={monthDaysTasks} />
      </div>
    </div>
  );
};
