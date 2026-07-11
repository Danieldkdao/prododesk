"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TaskTableSelectType } from "@/db/schema";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const Task = ({ task }: { task: TaskTableSelectType }) => {
  const [isComplete, setIsComplete] = useState(false);

  return (
    <div className="flex items-start gap-2 cursor-pointer">
      <Checkbox
        id={`task-${task.id}`}
        checked={isComplete}
        onCheckedChange={(checked) => setIsComplete(checked)}
        className="mt-1"
      />
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={`task-${task.id}`}>
          <span
            className={cn(
              "font-medium text-base normal-case!",
              isComplete && "text-muted-foreground line-through",
            )}
          >
            {task.emoji} {task.name}
          </span>
        </Label>
        <p className="text-sm text-muted-foreground">{task.description}</p>
      </div>
    </div>
  );
};
