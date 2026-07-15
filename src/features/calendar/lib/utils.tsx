import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { CircularProgressIndicator } from "@/components/ui/circular-progress-indicator";
import { TaskTableSelectType } from "@/db/schema";
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
import { CheckCircle2Icon, ListXIcon } from "lucide-react";
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
  tasks: TaskTableSelectType[],
) => {
  const today = new Date();
  const isToday = checkIsSameDay(today, date);
  const isPastDay = startOfDay(today) > date;
  const isFutureDay = endOfDay(today) < date;
  const isSameMonth = checkIsSameMonth(date, dateToUse);

  const hasNoTasks = !tasks.length;
  const allTasksCompleted = tasks.every(
    (task) => task.isCompleted && task.completedAt,
  );
  const incompleteTaskCount = tasks.filter((task) => !task.isCompleted).length;
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
  tasks: TaskTableSelectType[],
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

export const getCalendarDayTasksData = (
  dateToUse: Date,
  date: Date,
  tasks: TaskTableSelectType[],
): CalendarDayTasksStatusData => {
  const { incompleteTaskCount, taskCount, isPastDay } =
    calculateCalendarDayTasksValues(dateToUse, date, tasks);
  const status = getCalendarDayTasksStatus(dateToUse, date, tasks);

  switch (status) {
    case "all_tasks_complete":
      return {
        dayContent: (
          <TooltipWrapper content="You completed all the tasks!">
            <span>
              <CheckCircle2Icon className="size-14 text-emerald-600" />
            </span>
          </TooltipWrapper>
        ),
        bgColor: "bg-emerald-600/10",
      };
    case "day_not_in_month":
      return {
        dayContent: null,
        bgColor: "bg-muted/30 dark:bg-card/50",
      };
    case "incomplete_tasks":
      return {
        dayContent: (
          <div className="relative mb-4 flex items-center justify-center w-full h-full">
            <CircularProgressIndicator
              value={((taskCount - incompleteTaskCount) / taskCount) * 100}
              initialSize={100}
              color="text-destructive"
            />
            <div className="absolute flex flex-col items-center justify-center">
              <span
                className={cn(
                  "text-2xl font-bold md:text-3xl text-destructive",
                )}
              >
                {Math.round(
                  ((taskCount - incompleteTaskCount) / taskCount) * 100,
                )}
                %
              </span>
            </div>
          </div>
        ),
        bgColor: "bg-destructive/10",
      };
    case "no_tasks_other_day":
      return {
        dayContent: (
          <TooltipWrapper content="No tasks">
            <div className="flex w-full flex-col gap-2">
              {["6 AM", "9 AM", "12 PM", "3 PM"].map((time) => (
                <div key={time} className="flex items-center gap-2">
                  <span className="shrink-0 text-right text-[9px] opacity-60">
                    {time}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              ))}
            </div>
          </TooltipWrapper>
        ),
        bgColor: isPastDay ? "bg-muted-foreground/7.5" : "bg-card",
      };
    case "no_tasks_today":
      return {
        dayContent: (
          <>
            <h4 className="text-lg font-medium text-center">No tasks yet</h4>
            <p className="text-muted-foreground text-center text-base">
              Add your first one to get started!
            </p>
          </>
        ),
        bgColor: "bg-card",
      };
    default:
      throw new Error(
        `Unknown calendar day tasks status: ${status satisfies never}`,
      );
  }
};
