"use client";

import { Button } from "@/components/ui/button";
import { ProjectSelectType, TaskSelectType } from "@/db/schema";
import { BoardProperty } from "@/features/tasks/lib/types";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/react";
import { Loader2Icon, LucideIcon, PlusIcon } from "lucide-react";
import { ReactNode, useEffect, useRef } from "react";
import { TaskDialog } from "./task-dialog";

export const TaskBoardColumn = <
  Property extends BoardProperty,
  PropertyOption extends TaskSelectType[Property],
>({
  property,
  propertyValue,
  project,
  children,
  formatter,
  hasNextPage,
  isLoading,
  hasLoadError,
  onLoadMore,
}: {
  property: Property;
  propertyValue: PropertyOption;
  project?: ProjectSelectType;
  children?: ReactNode;
  formatter: (option: PropertyOption) => {
    label: string;
    icon: LucideIcon;
    textColor: string;
  };
  hasNextPage: boolean;
  isLoading: boolean;
  hasLoadError: boolean;
  onLoadMore: () => void;
}) => {
  const { ref, isDropTarget } = useDroppable({
    id: propertyValue as string,
  });
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinelRef.current;

    if (!element || !hasNextPage || isLoading || hasLoadError) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: "400px 0px",
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasLoadError, hasNextPage, isLoading, onLoadMore]);

  const { label, icon: StatusIcon, textColor } = formatter(propertyValue);

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 w-full bg-muted transition-all duration-300",
        isDropTarget && "bg-primary/15 outline-2 outline-primary/40",
      )}
    >
      <div className="px-4 pt-4 w-full flex items-center gap-2">
        <div className="w-full flex items-center gap-2 flex-1 min-w-0">
          <StatusIcon className={cn("size-5", textColor)} />
          <span className="text-xl font-medium">{label}</span>
        </div>
        <TaskDialog defaultValues={{ [property]: propertyValue, project }}>
          <Button variant="ghost" size="icon-sm">
            <PlusIcon />
          </Button>
        </TaskDialog>
      </div>
      <div className="flex flex-col gap-2 p-2">{children}</div>
      {isLoading && (
        <div className="flex h-10 items-center justify-center text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          <span className="sr-only">Loading more tasks</span>
        </div>
      )}
      {hasLoadError && (
        <Button variant="ghost" size="sm" onClick={onLoadMore}>
          Try loading the tasks again
        </Button>
      )}
      {hasNextPage && <div ref={sentinelRef} className="h-px" aria-hidden />}
    </div>
  );
};
