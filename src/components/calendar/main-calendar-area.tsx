"use client";

import { useMainCalendarStore } from "@/store/main-calendar-store";
import { MainCalendarDay } from "./main-calendar-day";
import { useQuery } from "@tanstack/react-query";
import { getCalendarTasksAction } from "@/features/tasks/actions/actions";
import { ErrorState } from "../error-state";

export const MainCalendarArea = () => {
  const monthDays = useMainCalendarStore((store) => store.monthDays);
  const startOfMonth = useMainCalendarStore((store) => store.startOfMonth);
  const endOfMonth = useMainCalendarStore((store) => store.endOfMonth);

  const { data, isPending, error } = useQuery({
    queryKey: ["tasks", "calendar", startOfMonth, endOfMonth, monthDays],
    queryFn: () => getCalendarTasksAction(startOfMonth, endOfMonth, monthDays),
  });

  if (isPending) {
    return <div>loading calendar</div>;
  }

  if (!data || error) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your calendar. Try refreshing the page or check back later if the issue persists."
      />
    );
  }

  return (
    <div className="grid grid-cols-7 h-full flex-1">
      {data.map(({ day, tasks }, index) => (
        <MainCalendarDay date={day} tasks={tasks} key={index} />
      ))}
    </div>
  );
};
