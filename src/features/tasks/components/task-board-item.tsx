"use client";

import { TaskSelectType } from "@/db/schema";
import { useDraggable } from "@dnd-kit/react";

export const TaskBoardItem = ({ task }: { task: TaskSelectType }) => {
  const { ref } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={ref}
      className="w-full h-20 border bg-muted flex items-center justify-center text-2xl font-semibold text-center"
    >
      {task.name}
    </div>
  );
};
