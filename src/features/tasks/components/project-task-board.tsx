"use client";

import { TaskStatus, taskStatuses } from "@/db/shared";
import { DragDropProvider } from "@dnd-kit/react";
import { TaskBoardColumn } from "./task-board-column";
import { useState } from "react";
import { TaskBoardItem } from "./task-board-item";

export const ProjectTaskBoard = () => {
  const [itemsColumnState, setItemsColumnState] = useState<
    Record<TaskStatus, string[]>
  >({
    backlog: ["1", "2"],
    completed: ["3", "4"],
    in_progress: ["5", "6"],
    not_started: ["7", "8"],
  });

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;

        const { source, target } = event.operation;

        if (!source?.id || !target?.id) return;

        setItemsColumnState((state) => {
          return Object.fromEntries(
            Object.entries(state).map(([status, items]) => {
              const defaultReturn = [status, items];
              if (status === target.id) {
                if (items.includes(String(source.id))) return defaultReturn;
                return [status, [...items, source.id]];
              }
              if (items.includes(String(source.id))) {
                return [
                  status,
                  items.filter((item) => item !== String(source.id)),
                ];
              }
              return defaultReturn;
            }),
          ) as typeof itemsColumnState;
        });
      }}
    >
      <div className="w-full grid grid-cols-4 gap-4">
        {taskStatuses.map((status) => {
          const items = itemsColumnState[status];

          return (
            <TaskBoardColumn key={status} status={status}>
              {items.map((item) => (
                <TaskBoardItem key={item} id={item} />
              ))}
            </TaskBoardColumn>
          );
        })}
      </div>
    </DragDropProvider>
  );
};
