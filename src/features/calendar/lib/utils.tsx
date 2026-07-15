import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { TaskTableSelectType } from "@/db/schema";
import {
  isSameDay as checkIsSameDay,
  isSameMonth as checkIsSameMonth,
  startOfMonth as getStartOfMonth,
  endOfMonth as getEndOfMonth,
  eachDayOfInterval as getEachDayOfInterval,
  startOfWeek as getStartOfWeek,
  endOfWeek as getEndOfWeek,
  differenceInCalendarDays as getDifferenceInCalendarDays,
  subDays,
  addDays,
  endOfDay,
  startOfDay,
} from "date-fns";
import {
  CheckCircle2Icon,
  CircleQuestionMark,
  CircleXIcon,
  ListXIcon,
} from "lucide-react";
import { ReactElement } from "react";

type CalendarDayTasksStatus =
  | "no_tasks_today"
  | "no_tasks_other_day"
  | "all_tasks_complete"
  | "incomplete_tasks_today"
  | "incomplete_tasks_other_day"
  | "upcoming_day"
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

  return {
    isToday,
    isPastDay,
    isFutureDay,
    isSameMonth,
    hasNoTasks,
    allTasksCompleted,
    incompleteTaskCount,
  };
};

const getCalendarDayTasksStatus = (
  dateToUse: Date,
  date: Date,
  tasks: TaskTableSelectType[],
) => {
  const { isToday, isFutureDay, isSameMonth, hasNoTasks, allTasksCompleted } =
    calculateCalendarDayTasksValues(dateToUse, date, tasks);

  const status: CalendarDayTasksStatus = isSameMonth
    ? !isFutureDay
      ? hasNoTasks
        ? isToday
          ? "no_tasks_today"
          : "no_tasks_other_day"
        : allTasksCompleted
          ? "all_tasks_complete"
          : isToday
            ? "incomplete_tasks_today"
            : "incomplete_tasks_other_day"
      : "upcoming_day"
    : "day_not_in_month";

  return status;
};

export const getCalendarDayTasksData = (
  dateToUse: Date,
  date: Date,
  tasks: TaskTableSelectType[],
): CalendarDayTasksStatusData => {
  const { incompleteTaskCount } = calculateCalendarDayTasksValues(
    dateToUse,
    date,
    tasks,
  );
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
    case "incomplete_tasks_other_day":
      return {
        dayContent: (
          <TooltipWrapper content="Unable to complete all tasks">
            <span>
              <CircleXIcon className="size-14 text-destructive" />
            </span>
          </TooltipWrapper>
        ),
        bgColor: "bg-destructive/10",
      };
    case "incomplete_tasks_today":
      return {
        dayContent: (
          <>
            <h4 className="text-2xl font-semibold text-center text-destructive">
              {incompleteTaskCount}
            </h4>
            <p className="text-muted-foreground text-center">tasks left</p>
          </>
        ),
        bgColor: "bg-destructive/10",
      };
    case "no_tasks_other_day":
      return {
        dayContent: (
          <TooltipWrapper content="No tasks">
            <span>
              <ListXIcon className="size-14 text-muted-foreground" />
            </span>
          </TooltipWrapper>
        ),
        bgColor: "bg-muted-foreground/7.5",
      };
    case "no_tasks_today":
      return {
        dayContent: (
          <>
            <h4 className="text-lg font-medium text-center">No tasks</h4>
            <p className="text-muted-foreground text-center">
              Add your first task to get started!
            </p>
          </>
        ),
        bgColor: "bg-card{",
      };
    case "upcoming_day":
      return {
        dayContent: (
          <TooltipWrapper content="This day is coming up...">
            <span>
              <CircleQuestionMark className="size-14 text-muted-foreground" />
            </span>
          </TooltipWrapper>
        ),
        bgColor: null,
      };
    default:
      throw new Error(
        `Unknown calendar day tasks status: ${status satisfies never}`,
      );
  }
};
