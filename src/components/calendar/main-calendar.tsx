"use client";

import { useMainCalendarStore } from "@/store/main-calendar-store";
import { addMonths, format } from "date-fns";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Suspense } from "react";
import { Button } from "../ui/button";
import { MainCalendarArea } from "./main-calendar-area";

export const MainCalendar = () => {
  return (
    <Suspense>
      <MainCalendarSuspense />
    </Suspense>
  );
};

const MainCalendarSuspense = () => {
  const dateToUse = useMainCalendarStore((store) => store.dateToUse);
  const weekDays = useMainCalendarStore((store) => store.weekDays);
  const setDateToUse = useMainCalendarStore((store) => store.setDateToUse);

  const changeDateToUse = (amount: 1 | -1) =>
    setDateToUse(addMonths(dateToUse, amount));

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
      <MainCalendarArea />
    </div>
  );
};
