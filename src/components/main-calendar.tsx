"use client";

import { cn } from "@/lib/utils";
import {
  addDays,
  addMonths,
  format,
  differenceInCalendarDays as getDifferenceInCalendarDays,
  eachDayOfInterval as getEachDayOfInterval,
  endOfMonth as getEndOfMonth,
  endOfWeek as getEndOfWeek,
  isPast as getIsPast,
  isSameDay as getIsSameDay,
  startOfMonth as getStartOfMonth,
  startOfWeek as getStartOfWeek,
  subDays,
} from "date-fns";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Suspense, useState } from "react";
import { Button } from "./ui/button";

export const MainCalendar = () => {
  return (
    <Suspense>
      <MainCalendarSuspense />
    </Suspense>
  );
};

const MainCalendarSuspense = () => {
  const today = new Date();
  const [dateToUse, setDateToUse] = useState(getStartOfMonth(today));
  const startOfMonth = getStartOfMonth(dateToUse);
  const endOfMonth = getEndOfMonth(dateToUse);
  const weekDays = getEachDayOfInterval({
    start: getStartOfWeek(dateToUse, { weekStartsOn: 1 }),
    end: getEndOfWeek(dateToUse, { weekStartsOn: 1 }),
  });
  const differenceInFirstDays = getDifferenceInCalendarDays(
    startOfMonth,
    getStartOfWeek(startOfMonth, { weekStartsOn: 1 }),
  );
  const differenceInLastDays = getDifferenceInCalendarDays(
    getEndOfWeek(endOfMonth, { weekStartsOn: 1 }),
    endOfMonth,
  );
  const monthDays = getEachDayOfInterval({
    start: subDays(startOfMonth, differenceInFirstDays),
    end: addDays(endOfMonth, differenceInLastDays),
  });

  const changeDateToUse = (amount: 1 | -1) =>
    setDateToUse((prev) => addMonths(prev, amount));

  return (
    <div className="h-full w-full flex flex-col">
      <div className="shrink-0 flex flex-col">
        <div className="flex items-center gap-2 justify-between pl-2">
          <h2 className="text-2xl font-medium">
            {format(dateToUse, "MMMM yyyy")}
          </h2>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeDateToUse(-1)}
            >
              <ArrowLeftIcon />
            </Button>
            <Button
              variant="outline"
              onClick={() => changeDateToUse(1)}
              size="icon"
            >
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
        <div className="w-full flex items-center"></div>
        <div className="grid grid-cols-7">
          {weekDays.map((day, index) => (
            <div key={index} className="border p-2">
              {format(day, "EEEE")}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 h-full flex-1">
        {monthDays.map((date, index) => {
          const isSameDay = getIsSameDay(today, date);
          const isPastDay = getIsPast(date);

          return (
            <div
              key={index}
              className={cn(
                "w-full h-full border p-2",

                isPastDay && "bg-muted dark:bg-card",
                isSameDay && "bg-red-400 dark:bg-red-400",
              )}
            >
              {format(date, "d")}
            </div>
          );
        })}
      </div>
    </div>
  );
};
