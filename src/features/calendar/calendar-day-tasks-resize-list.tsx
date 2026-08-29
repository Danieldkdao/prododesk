"use client";

import { TaskSelectType } from "@/db/schema";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { TaskCalendarItem } from "../tasks/components/task-calendar-item";
import { useTaskDetailsDialog } from "../tasks/hooks/use-task-details-dialog";

export const CalendarDayTasksResizeList = ({
  tasks,
}: {
  tasks: TaskSelectType[];
}) => {
  const { openTaskDetails } = useTaskDetailsDialog();
  const [hiddenCount, setHiddenCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);

  const measureOverflow = useCallback(() => {
    const container = containerRef.current;
    const counter = counterRef.current;

    if (!container || !counter) return;

    const taskElements = Array.from(
      container.querySelectorAll<HTMLElement>("[data-calendar-task]"),
    );

    taskElements.forEach((element) => {
      element.style.removeProperty("display");
    });

    counter.style.display = "none";

    let nextHiddenCount = 0;

    if (container.scrollHeight > container.clientHeight) {
      counter.style.removeProperty("display");

      for (let i = taskElements.length - 1; i >= 0; i--) {
        const element = taskElements[i];
        if (!element) continue;

        element.style.display = "none";
        nextHiddenCount += 1;

        if (container.scrollHeight <= container.clientHeight) {
          break;
        }
      }
    }

    setHiddenCount((current) =>
      current === nextHiddenCount ? current : nextHiddenCount,
    );
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrame = requestAnimationFrame(measureOverflow);

    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(measureOverflow);
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [tasks, measureOverflow]);

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col gap-1 overflow-hidden h-45 min-w-0"
    >
      {tasks.map((task) => (
        <div
          key={task.id}
          data-calendar-task
          className="shrink-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            openTaskDetails(task.id);
          }}
        >
          <TaskCalendarItem task={task} />
        </div>
      ))}
      <div
        ref={counterRef}
        style={{ display: hiddenCount > 0 ? undefined : "none" }}
        className="shrink-0 px-2 py-1 font-medium flex items-center justify-center"
      >
        <span className="text-muted-foreground font-medium">
          +{hiddenCount} more
        </span>
      </div>
    </div>
  );
};
