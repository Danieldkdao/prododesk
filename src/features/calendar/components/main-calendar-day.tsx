import { TaskSelectType } from "@/db/schema";
import { TaskCalendarItem } from "@/features/tasks/components/task-calendar-item";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { useTasksParams } from "@/features/tasks/hooks/use-tasks-params";
import { defaultDayTasksParamsOptions } from "@/features/tasks/lib/tasks-params";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { PlusIcon } from "lucide-react";
import { TooltipWrapper } from "../../../components/tooltip-wrapper";
import { Button } from "../../../components/ui/button";
import { useCalendarParams } from "../hooks/use-calendar-params";
import { calculateCalendarDayTasksValues } from "../lib/utils";
import { CalendarDayTasksResizeList } from "../calendar-day-tasks-resize-list";

export const MainCalendarDay = ({
  date,
  tasks,
}: {
  date: Date;
  tasks: TaskSelectType[];
}) => {
  const [calendarFilters, setCalendarFilters] = useCalendarParams();
  const [, setDayTasksFilters] = useTasksParams();

  const { isToday, isPastDay, isSameMonth } = calculateCalendarDayTasksValues(
    calendarFilters.month,
    date,
    tasks,
  );

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
      <CalendarDayTasksResizeList tasks={tasks} />
    </div>
  );
};
