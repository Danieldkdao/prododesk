"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MilestoneStatus,
  milestoneStatuses,
  ProjectSelectType,
  TaskSelectType,
} from "@/db/schema";
import { TaskMilestoneItem } from "@/features/tasks/components/task-milestone-item";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/react/sortable";
import { format, parse } from "date-fns";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  EditIcon,
  EllipsisIcon,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ReadProjectMilestonesActionType,
  updateMilestoneStatusAction,
} from "../actions/actions";
import { formatMilestoneStatus } from "../lib/formatters";
import { DeleteMilestoneButton } from "./delete-milestone-button";
import { MilestoneDialog } from "./milestone-dialog";

export const MilestoneCard = ({
  milestone,
  tasks,
  index,
  isLast = false,
}: {
  milestone: ReadProjectMilestonesActionType["milestones"][number];
  tasks: (TaskSelectType & { project: ProjectSelectType | null })[];
  index: number;
  isLast?: boolean;
}) => {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [isStatusPending, startStatusTransition] = useTransition();
  const [status, setStatus] = useState(milestone.status);
  const { ref, handleRef, isDropTarget } = useSortable({
    id: milestone.id,
    index,
    type: "milestone",
    accept: ["task", "milestone"],
  });

  const {
    label,
    icon: MilestoneStatusIcon,
    bgColor,
    textColor,
    borderColor,
  } = formatMilestoneStatus(status);

  const taskLabel = tasks.length === 1 ? "1 task" : `${tasks.length} tasks`;

  const handleStatusUpdate = (newStatus: MilestoneStatus) => {
    const prevStatus = status;

    setStatus(newStatus);

    startStatusTransition(async () => {
      const response = await updateMilestoneStatusAction(
        milestone.id,
        newStatus,
      );
      if (response.error) {
        setStatus(prevStatus);
        toast.error(response.message);
      }
    });
  };

  return (
    <>
      <MilestoneDialog
        projectId={milestone.projectId}
        existingMilestone={milestone}
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
      />
      <div ref={ref} className="flex w-full min-w-0 gap-3">
        <div className="flex shrink-0 flex-col items-center">
          <DropdownMenu>
            <DropdownMenuTrigger
              nativeButton={false}
              disabled={isStatusPending}
              render={
                <div
                  className={cn(
                    "mt-3 flex size-9 items-center justify-center border cursor-pointer",
                    bgColor,
                    textColor,
                    borderColor,
                  )}
                >
                  <MilestoneStatusIcon className="size-5" />
                </div>
              }
            />
            <DropdownMenuContent>
              {milestoneStatuses.map((status) => {
                const { label, icon: Icon } = formatMilestoneStatus(status);

                return (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                  >
                    <Icon className="size-5" />
                    <span>{label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {!isLast && <div className="mt-2 w-px flex-1 bg-border" />}
        </div>

        <Collapsible className="group min-w-0 flex-1 pb-4">
          <div
            className={cn(
              "flex items-start border bg-card shadow-sm transition-colors hover:bg-muted/20",
              isDropTarget && "border-primary",
            )}
          >
            <button ref={handleRef} className="py-4.5 pr-1 pl-4 cursor-pointer">
              <GripVerticalIcon className="size-5 text-muted-foreground" />
            </button>
            <CollapsibleTrigger className="min-w-0 flex-1 pr-4 py-4 pl-1 text-left cursor-pointer">
              <div className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-lg font-medium">
                  {milestone.name}
                </span>

                <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-data-open:rotate-180" />
              </div>

              {milestone.description ? (
                <p className="mt-1 line-clamp-2 text-base text-muted-foreground">
                  {milestone.description}
                </p>
              ) : (
                <p className="mt-1 text-base italic text-muted-foreground">
                  No description
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className={cn("font-medium text-base", textColor)}>
                  {label}
                </span>

                <span className="text-base">{taskLabel}</span>

                {milestone.dueAt && (
                  <span className="flex items-center gap-1.5 text-base">
                    <CalendarDaysIcon className="size-5" />
                    Due{" "}
                    {format(
                      parse(milestone.dueAt, "yyyy-MM-dd", new Date()),
                      "PP",
                    )}
                  </span>
                )}
              </div>
            </CollapsibleTrigger>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="m-3 shrink-0"
                  >
                    <EllipsisIcon />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setUpdateDialogOpen(true)}>
                  <EditIcon />
                  Edit
                </DropdownMenuItem>

                <DropdownMenuItem
                  nativeButton
                  variant="destructive"
                  render={
                    <DeleteMilestoneButton
                      milestoneId={milestone.id}
                      variant="destructive"
                      className="h-auto w-full justify-start bg-transparent px-2 py-1.5"
                    >
                      <Trash2Icon />
                      Delete
                    </DeleteMilestoneButton>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CollapsibleContent className="overflow-hidden">
            <div className="ml-4 border-l-2 border-border px-4 pt-3">
              {tasks.length ? (
                <div className="flex flex-col gap-2">
                  {tasks.map((task) => (
                    <TaskMilestoneItem key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <PlusIcon className="size-4" />
                  No tasks assigned
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </>
  );
};
