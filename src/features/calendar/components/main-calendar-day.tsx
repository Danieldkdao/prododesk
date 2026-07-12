import { TaskTableSelectType } from "@/db/schema";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { PlusIcon } from "lucide-react";
import { TooltipWrapper } from "../../../components/tooltip-wrapper";
import { Button } from "../../../components/ui/button";
import { useCalendarParams } from "../hooks/use-calendar-params";
import {
  calculateCalendarDayTasksValues,
  getCalendarDayTasksData,
} from "../lib/utils";

export const MainCalendarDay = ({
  date,
  tasks,
}: {
  date: Date;
  tasks: TaskTableSelectType[];
}) => {
  const [filters, setFilters] = useCalendarParams();

  const { isToday, isPastDay, isSameMonth } = calculateCalendarDayTasksValues(
    filters.month,
    date,
    tasks,
  );
  const { dayContent, bgColor } = getCalendarDayTasksData(
    filters.month,
    date,
    tasks,
  );

  return (
    <div
      className={cn(
        "min-h-0 min-w-0 border p-2 cursor-pointer flex flex-col",
        bgColor,
        !isSameMonth && "bg-muted/30 dark:bg-card/50 text-muted-foreground",
      )}
      onClick={() => {
        setFilters({
          day: new Date(date.toUTCString()),
        });
      }}
    >
      <div className="flex items-center gap-2 flex-wrap w-full justify-between">
        {isToday ? (
          <TooltipWrapper content="Today">
            <div className="size-6 bg-primary rounded-full shrink-0 flex items-center justify-center">
              <span className="text-white">{format(date, "d")}</span>
            </div>
          </TooltipWrapper>
        ) : (
          <span>{format(date, "d")}</span>
        )}
        <div onClick={(e) => e.stopPropagation()}>
          {isSameMonth && !isPastDay && (
            <TaskDialog day={date}>
              <TooltipWrapper content="Add task">
                <Button variant="ghost" size="icon-xs">
                  <PlusIcon />
                </Button>
              </TooltipWrapper>
            </TaskDialog>
          )}
        </div>
      </div>
      <div className="w-full flex flex-col flex-1 h-full items-center justify-center">
        {dayContent}
      </div>
    </div>
  );
};
