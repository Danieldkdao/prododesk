"use client";

import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMilestoneStatus } from "@/features/milestones/lib/formatters";
import { formatColor, formatTaskDates } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheckIcon,
  CalendarClockIcon,
  CircleDotIcon,
  FlagIcon,
  FolderKanbanIcon,
  ListCheckIcon,
  MilestoneIcon,
} from "lucide-react";
import { ReactNode } from "react";
import { readTaskAction, ReadTaskActionReturnType } from "../actions/actions";
import { formatTaskPriority, formatTaskStatus } from "../lib/formatters";
import { DeleteTaskButton } from "./delete-task-button";
import { TaskDialog } from "./task-dialog";
import { UpdateTaskStatusButton } from "./update-task-status-button";

const EmptyDetailsState = ({ text }: { text: string }) => {
  return (
    <div className="flex items-center gap-2 py-0.5 px-2 min-w-0 bg-primary/20">
      <div className="flex-1 min-w-0">
        <span className="text-base font-medium truncate block text-primary">
          {text}
        </span>
      </div>
    </div>
  );
};

const TaskDialogDetailsLoading = () => {
  return (
    <>
      <DialogHeader className="sr-only">
        <DialogTitle>Loading tasks details</DialogTitle>
      </DialogHeader>
      <div className="flex min-w-0 flex-col gap-4 px-6 pt-6">
        <div className="flex min-w-0 flex-col items-start gap-4 @xl:flex-row">
          <Skeleton className="size-16 shrink-0" />
          <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-3/4 max-w-md" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-4 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex min-w-0 w-full items-center justify-between gap-4"
                >
                  <div className="flex shrink-0 items-center gap-2">
                    <Skeleton className="size-5" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton
                    className={cn(
                      "h-8",
                      index === 2 || index === 3 ? "w-36" : "w-28",
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <DialogFooter className="flex w-full flex-row! items-center justify-between! gap-2 px-6 pb-6">
        <Skeleton className="h-10 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-36" />
        </div>
      </DialogFooter>
    </>
  );
};

const TaskDialogDetailsError = () => {
  return (
    <>
      <DialogHeader className="sr-only">
        <DialogTitle>An error occurred</DialogTitle>
      </DialogHeader>
      <ErrorState
        title="An error occurred"
        description="We were unable to load the details for this task. Try refreshing the page or check the URL."
      />
    </>
  );
};

const TaskDialogDetailsSuspense = ({
  data,
}: {
  data: ReadTaskActionReturnType;
}) => {
  const { project, milestone, ...task } = data;

  const { text: projectTextColor, bgLight: projectBgLight } = formatColor(
    project?.color || "cyan",
  );
  const {
    label: taskStatus,
    icon: TaskStatusIcon,
    textColor: taskStatusTextColor,
    bgColor: taskStatusBgColor,
  } = formatTaskStatus(task.status);
  const {
    label: taskPriority,
    icon: TaskPriorityIcon,
    textColor: taskPriorityTextColor,
    bgColor: taskPriorityBgColor,
  } = formatTaskPriority(task.priority);
  const {
    icon: MilestoneStatusIcon,
    textColor: milestoneStatusTextColor,
    bgColor: milestoneStatusBgColor,
  } = formatMilestoneStatus(milestone?.status || "not_started");

  const details = [
    {
      label: "Status",
      labelIcon: CircleDotIcon,
      children: (
        <div
          className={cn(
            "flex items-center gap-2 py-0.5 px-2 min-w-0",
            taskStatusBgColor,
            taskStatusTextColor,
          )}
        >
          <TaskStatusIcon className="size-5" />
          <div className="flex-1 min-w-0">
            <span
              className={cn(
                "text-base font-medium truncate block",
                taskStatusTextColor,
              )}
            >
              {taskStatus}
            </span>
          </div>
        </div>
      ),
    },
    {
      label: "Priority",
      labelIcon: FlagIcon,
      children: (
        <div
          className={cn(
            "flex items-center gap-2 py-0.5 px-2 min-w-0",
            taskPriorityBgColor,
            taskPriorityTextColor,
          )}
        >
          <TaskPriorityIcon className="size-5" />
          <div className="flex-1 min-w-0">
            <span
              className={cn(
                "text-base font-medium truncate block",
                taskPriorityTextColor,
              )}
            >
              {taskPriority}
            </span>
          </div>
        </div>
      ),
    },
    {
      label: "Scheduled",
      labelIcon: CalendarClockIcon,
      children: (
        <EmptyDetailsState
          text={
            task.scheduledAt
              ? (formatTaskDates(task.scheduledAt, null) ?? "Not scheduled")
              : "Not scheduled"
          }
        />
      ),
    },
    {
      label: "Due",
      labelIcon: CalendarCheckIcon,
      children: (
        <EmptyDetailsState
          text={
            task.dueAt
              ? (formatTaskDates(null, task.dueAt) ?? "Not due")
              : "Not due"
          }
        />
      ),
    },
    {
      label: "Project",
      labelIcon: FolderKanbanIcon,
      children: project ? (
        <div
          className={cn(
            "flex items-center gap-2 py-0.5 px-2 min-w-0",
            projectBgLight,
          )}
        >
          {project.icon && <span>{project.icon}</span>}
          <div className="flex-1 min-w-0">
            <span
              className={cn(
                "text-base font-medium truncate block",
                projectTextColor,
              )}
            >
              {project.name}
            </span>
          </div>
        </div>
      ) : (
        <EmptyDetailsState text="No project" />
      ),
    },
    {
      label: "Milestone",
      labelIcon: MilestoneIcon,
      children: milestone ? (
        <div
          className={cn(
            "flex items-center gap-2 py-0.5 px-2 min-w-0",
            milestoneStatusBgColor,
            milestoneStatusTextColor,
          )}
        >
          <MilestoneStatusIcon className="size-5" />
          <div className="flex-1 min-w-0">
            <span className="text-base font-medium truncate block">
              {milestone.name}
            </span>
          </div>
        </div>
      ) : (
        <EmptyDetailsState text="No project" />
      ),
    },
  ];

  return (
    <>
      <DialogHeader className="sr-only">
        <DialogTitle>{task.name}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 px-6 pt-6 min-w-0">
        <div className="flex flex-col @xl:flex-row items-start gap-4 min-w-0">
          <div className="size-16 flex items-center justify-center shrink-0 bg-primary/20">
            {task?.emoji ? (
              <span className="text-4xl">{task?.emoji}</span>
            ) : (
              <ListCheckIcon className="size-10" />
            )}
          </div>
          <div className="flex flex-col gap-4 flex-1 w-full min-w-0">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-2xl font-semibold">{task.name}</h2>
              <p
                className={cn(
                  "text-muted-foreground text-lg",
                  !task.description && "italic",
                )}
              >
                {task.description || "No description provided."}
              </p>
            </div>
            <div className="grid grid-cols-1 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 min-w-0">
              {details.map((detail) => (
                <div
                  className="flex items-center gap-4 justify-between w-full min-w-0"
                  key={detail.label}
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <detail.labelIcon className="size-5 text-muted-foreground" />
                    <span className="text-base font-medium text-muted-foreground">
                      {detail.label}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 flex justify-end">
                    {detail.children}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Separator />
      <DialogFooter className="w-full flex flex-row! items-center gap-2 justify-between! pb-6 px-6">
        <DeleteTaskButton taskId={task.id} variant="destructive">
          Delete
        </DeleteTaskButton>
        <div className="flex items-center gap-2">
          <TaskDialog
            existingTask={task}
            defaultValues={{ project, milestone }}
          >
            <Button variant="outline">Edit</Button>
          </TaskDialog>
          <UpdateTaskStatusButton taskId={task.id} newStatus="completed">
            Complete task
          </UpdateTaskStatusButton>
        </div>
      </DialogFooter>
    </>
  );
};

export const TaskDialogDetails = ({ taskId }: { taskId: string }) => {
  const { data, error, isPending } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => readTaskAction(taskId),
    enabled: Boolean(taskId),
  });

  let elementToRender: ReactNode | null = null;

  if (!taskId) return null;

  if (isPending) {
    elementToRender = <TaskDialogDetailsLoading />;
  } else if (error || !data) {
    elementToRender = <TaskDialogDetailsError />;
  } else if (data) {
    elementToRender = <TaskDialogDetailsSuspense data={data} />;
  }

  return (
    <DialogContent className="p-0 sm:max-w-3xl @container flex flex-col gap-6">
      {elementToRender}
    </DialogContent>
  );
};
