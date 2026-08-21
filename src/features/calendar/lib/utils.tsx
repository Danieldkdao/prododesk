import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { CircularProgressIndicator } from "@/components/ui/circular-progress-indicator";
import { TaskSelectType } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  addDays,
  isSameDay as checkIsSameDay,
  isSameMonth as checkIsSameMonth,
  endOfDay,
  differenceInCalendarDays as getDifferenceInCalendarDays,
  eachDayOfInterval as getEachDayOfInterval,
  endOfMonth as getEndOfMonth,
  endOfWeek as getEndOfWeek,
  startOfMonth as getStartOfMonth,
  startOfWeek as getStartOfWeek,
  startOfDay,
  subDays,
} from "date-fns";
import { CheckCircle2Icon } from "lucide-react";
import { ReactElement } from "react";

type CalendarDayTasksStatus =
  | "no_tasks_today"
  | "no_tasks_other_day"
  | "all_tasks_complete"
  | "incomplete_tasks"
  | "day_not_in_month";
type CalendarDayTasksStatusData = {
  dayContent: ReactElement | null;
  bgColor: string | null;
};

export const calculateCalendarValues = (dateToUse: Date) => {
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

  return { startOfMonth, endOfMonth, weekDays, monthDays };
};

export const calculateCalendarDayTasksValues = (
  dateToUse: Date,
  date: Date,
  tasks: TaskSelectType[],
) => {
  const today = new Date();
  const isToday = checkIsSameDay(today, date);
  const isPastDay = startOfDay(today) > date;
  const isFutureDay = endOfDay(today) < date;
  const isSameMonth = checkIsSameMonth(date, dateToUse);

  const hasNoTasks = !tasks.length;
  const allTasksCompleted = tasks.every((task) => task.status === "completed");
  const incompleteTaskCount = tasks.filter(
    (task) => task.status !== "completed",
  ).length;
  const taskCount = tasks.length;

  return {
    isToday,
    isPastDay,
    isFutureDay,
    isSameMonth,
    hasNoTasks,
    allTasksCompleted,
    incompleteTaskCount,
    taskCount,
  };
};

const getCalendarDayTasksStatus = (
  dateToUse: Date,
  date: Date,
  tasks: TaskSelectType[],
) => {
  const { isToday, isSameMonth, hasNoTasks, allTasksCompleted } =
    calculateCalendarDayTasksValues(dateToUse, date, tasks);

  const status: CalendarDayTasksStatus = isSameMonth
    ? hasNoTasks
      ? isToday
        ? "no_tasks_today"
        : "no_tasks_other_day"
      : allTasksCompleted
        ? "all_tasks_complete"
        : "incomplete_tasks"
    : "day_not_in_month";

  return status;
};
