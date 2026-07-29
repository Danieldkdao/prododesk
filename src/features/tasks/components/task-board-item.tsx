"use client";

import { useDraggable } from "@dnd-kit/react";

export const TaskBoardItem = ({ id }: { id: string }) => {
  const { ref } = useDraggable({
    id,
  });

  return (
    <div
      ref={ref}
      className="w-full h-20 border bg-muted flex items-center justify-center text-2xl font-semibold text-center"
    >
      {id}
    </div>
  );
};
