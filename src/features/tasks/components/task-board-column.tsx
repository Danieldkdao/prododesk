"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TaskStatus } from "@/db/shared";
import { useDroppable } from "@dnd-kit/react";
import { ReactNode } from "react";
import { formatTaskStatus } from "../lib/formatters";

export const TaskBoardColumn = ({
  status,
  children,
}: {
  status: TaskStatus;
  children?: ReactNode;
}) => {
  const { ref } = useDroppable({
    id: status,
  });

  return (
    <Card ref={ref} className="border-2 border-dashed">
      <CardContent className="flex flex-col gap-2">
        <span className="text-xl font-semibold">
          {formatTaskStatus(status).label}
        </span>
        {children}
      </CardContent>
    </Card>
  );
};
