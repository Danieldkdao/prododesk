"use client";

import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { useCalendarParams } from "@/features/calendar/hooks/use-calendar-params";
import { DayTasksPanelContent } from "./day-tasks-panel-content";
import { GetCalendarTasksActionReturnType } from "../actions/actions";

export const DayTasksPanel = (props: {
  dayTasks: GetCalendarTasksActionReturnType["selectedDayTasks"];
}) => {
  const [filters] = useCalendarParams();

  if (!filters.day) return null;

  return (
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
