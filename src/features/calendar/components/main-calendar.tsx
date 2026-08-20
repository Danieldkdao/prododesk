"use client";

import { ReadCalendarTasksActionReturnType } from "@/features/tasks/actions/actions";
import { addMonths, format } from "date-fns";
import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useCalendarParams } from "../hooks/use-calendar-params";
import { calculateCalendarValues } from "../lib/utils";
import { MainCalendarArea } from "./main-calendar-area";
import { MainCalendarSkeleton } from "./main-calendar-skeleton";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarViewOption,
  calendarViewOptions,
} from "../lib/calendar-params";
import { formatCalendarViewOption } from "../lib/formatters";

export const MainCalendar = ({
  monthDaysTasks,
  fullScreen = false,
}: {
  monthDaysTasks: ReadCalendarTasksActionReturnType;
  fullScreen?: boolean;
}) => {
  const [filters, setFilters] = useCalendarParams();

  const { weekDays } = calculateCalendarValues(filters.month);

  if (
    format(monthDaysTasks.month, "yyyy-MM-dd") !==
    format(filters.month, "yyyy-MM-dd")
  ) {
    return <MainCalendarSkeleton fixedHeight />;
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
          "flex items-center gap-2 shrink-0 w-full py-1 justify-between",
          fullScreen && "border-t border-x px-2",
        )}
      >
        <div className="flex items-center gap-2">
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
        <Tabs
          value={filters.view}
          onValueChange={(value) =>
            setFilters({ view: value as CalendarViewOption })
          }
        >
          <TabsList>
            {calendarViewOptions.map((option) => (
              <TabsTrigger key={option} value={option}>
                {formatCalendarViewOption(option)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className="min-h-0 w-full flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full min-h-0 min-w-300 flex-col overflow-hidden border">
          <div className="grid shrink-0 grid-cols-7">
            {weekDays.map((day, index) => (
              <div key={index} className="flex justify-center border p-2">
                <span className="text-center font-medium">
                  {format(day, "EEEE")}
                </span>
              </div>
            ))}
          </div>
          <MainCalendarArea monthDaysTasksRes={monthDaysTasks} />
        </div>
      </div>
    </div>
  );
};
