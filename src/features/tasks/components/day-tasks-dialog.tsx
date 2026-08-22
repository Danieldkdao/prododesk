"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCalendarParams } from "@/features/calendar/hooks/use-calendar-params";
import { format } from "date-fns";
import { ReadTasksActionReturnType } from "../actions/actions";
import { DayTasksContent } from "./day-tasks-content";

export const DayTasksDialog = (props: {
  dayTasks: ReadTasksActionReturnType | null;
  readOptions?: {
    areaIds?: string[] | undefined;
    projectIds?: string[] | undefined;
  };
}) => {
  const [filters, setFilters] = useCalendarParams();

  if (!filters.day) return null;

  return (
    <Dialog
      open={!!filters.day}
      onOpenChange={(open) => !open && setFilters({ day: null })}
    >
      <DialogContent
        showCloseButton={false}
        className="h-[calc(100dvh-2rem)] grid-rows-[minmax(0,1fr)] overflow-hidden sm:h-[42rem]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{format(filters.day, "MMMM d, yyyy")}</DialogTitle>
        </DialogHeader>
        <DayTasksContent {...props} />
      </DialogContent>
    </Dialog>
  );
};
