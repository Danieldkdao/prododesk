"use client";

import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { useCalendarParams } from "@/features/calendar/hooks/use-calendar-params";
import { GetDayTasksActionReturnType } from "../actions/actions";
import { DayTasksPanelContent } from "./day-tasks-panel-content";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { format } from "date-fns";

export const DayTasksPanel = (props: {
  dayTasks: GetDayTasksActionReturnType | null;
}) => {
  const isMobile = useIsMobile();
  const [filters, setFilters] = useCalendarParams();

  if (!filters.day) return null;

  return isMobile ? (
    <Sheet
      open={!!filters.day}
      onOpenChange={() => {
        if (filters.day) {
          setFilters({ day: null });
        }
      }}
    >
      <SheetContent showCloseButton={false}>
        <SheetHeader className="sr-only">
          <SheetTitle>{format(filters.day, "PPP")}</SheetTitle>
          <SheetDescription>Track your tasks today.</SheetDescription>
        </SheetHeader>
        <DayTasksPanelContent {...props} />
      </SheetContent>
    </Sheet>
  ) : (
    <>
      <ResizableHandle withHandle />
      <ResizablePanel
        defaultSize="30%"
        minSize="20%"
        className="min-h-0 overflow-hidden"
      >
        <DayTasksPanelContent {...props} />
      </ResizablePanel>
    </>
  );
};
