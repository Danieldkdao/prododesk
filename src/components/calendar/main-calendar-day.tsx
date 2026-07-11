import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { cn } from "@/lib/utils";
import { useMainCalendarStore } from "@/store/main-calendar-store";
import {
  isSameDay as checkIsSameDay,
  format,
  startOfDay,
  isSameMonth as checkIsSameMonth,
} from "date-fns";
import { TooltipWrapper } from "../tooltip-wrapper";
import { Button } from "../ui/button";
import { PlusIcon } from "lucide-react";
import { TaskTableSelectType } from "@/db/schema";

export const MainCalendarDay = ({
  date,
  tasks,
}: {
  date: Date;
  tasks: TaskTableSelectType[];
}) => {
  const today = useMainCalendarStore((store) => store.today);
  const dateToUse = useMainCalendarStore((store) => store.dateToUse);
  const isSameDay = checkIsSameDay(today, date);
  const isPastDay = startOfDay(today) > date;
  const isSameMonth = checkIsSameMonth(date, dateToUse);

  return (
    <div
      className={cn(
        "w-full h-full border p-2",
        !isSameMonth && "bg-muted/30 dark:bg-card/50 text-muted-foreground",
        isSameDay && "bg-primary/20 dark:bg-primary/20",
      )}
      onClick={() => console.log("clicked")}
    >
      <div className="flex items-center gap-2 flex-wrap w-full justify-between">
        <span>{format(date, "d")}</span>
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
      <span>Number of tasks: {tasks.length}</span>
    </div>
  );
};
