import { TaskSelectType } from "@/db/schema";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { useTasksParams } from "@/features/tasks/hooks/use-tasks-params";
import { defaultDayTasksParamsOptions } from "@/features/tasks/lib/tasks-params";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { PlusIcon } from "lucide-react";
import { TooltipWrapper } from "../../../components/tooltip-wrapper";
import { Button } from "../../../components/ui/button";
import { CalendarDayTasksResizeList } from "../calendar-day-tasks-resize-list";
import { useCalendarParams } from "../hooks/use-calendar-params";
import { calculateCalendarDayTasksValues } from "../lib/utils";
import { CalendarViewOption } from "../lib/calendar-params";

export const MainCalendarDay = ({
  date,
  tasks,
}: {
  date: Date;
  tasks: {
    scheduled: TaskSelectType[];
    due: TaskSelectType[];
  };
}) => {
  const [calendarFilters, setCalendarFilters] = useCalendarParams();
  const [, setDayTasksFilters] = useTasksParams();

  const allTasks = Array.from(
    new Map(
      [...tasks.scheduled, ...tasks.due].map((task) => [task.id, task]),
    ).values(),
  );

  const { isToday, isPastDay, isSameMonth } = calculateCalendarDayTasksValues(
    calendarFilters.month,
    date,
    allTasks,
  );

  const tasksMap: Record<CalendarViewOption, TaskSelectType[]> = {
    all: allTasks,
    scheduled: tasks.scheduled,
    due: tasks.due,
  };

  const tasksToShow = tasksMap[calendarFilters.view];

  return (
    <div
      className={cn(
        "min-h-0 min-w-0 border p-2 cursor-pointer flex flex-col gap-2",
        !isSameMonth && "bg-muted/30 dark:bg-card/50 text-muted-foreground",
      )}
      onClick={() => {
        setCalendarFilters({
          day: new Date(date.toUTCString()),
        });
        setDayTasksFilters(defaultDayTasksParamsOptions);
      }}
    >
      <div className="flex items-start gap-2 flex-wrap w-full justify-between">
        {isToday ? (
          <TooltipWrapper content="Today">
            <div className="size-8 bg-primary rounded-full shrink-0 flex items-center justify-center">
              <span className="text-white text-lg">{format(date, "d")}</span>
            </div>
          </TooltipWrapper>
        ) : (
          <span>{format(date, "d")}</span>
        )}
        <div onClick={(e) => e.stopPropagation()}>
          {isSameMonth && !isPastDay && (
            <TaskDialog defaultValues={{ day: date }}>
              <TooltipWrapper content="Add task">
                <Button variant="ghost" size="icon-xs">
                  <PlusIcon />
                </Button>
              </TooltipWrapper>
            </TaskDialog>
          )}
        </div>
      </div>
      <CalendarDayTasksResizeList tasks={tasksToShow} />
    </div>
  );
};
