"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import {
  CalendarDaysIcon,
  EditIcon,
  EllipsisIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { ReadProjectMilestonesActionType } from "../actions/actions";
import { formatMilestoneStatus } from "../lib/formatters";
import { DeleteMilestoneButton } from "./delete-milestone-button";
import { MilestoneDialog } from "./milestone-dialog";
import { useDroppable } from "@dnd-kit/react";

export const MilestoneCard = ({
  milestone,
}: {
  milestone: ReadProjectMilestonesActionType["milestones"][number];
}) => {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const { ref } = useDroppable({
    id: milestone.id,
  });
  const {
    icon: MilestoneStatusIcon,
    bgColor,
    textColor,
    borderColor,
  } = formatMilestoneStatus(milestone.status);

  return (
    <>
      <MilestoneDialog
        projectId={milestone.projectId}
        existingMilestone={milestone}
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
      />
      <div ref={ref} className="flex items-start gap-4 w-full min-w-0">
        <div
          className={cn(
            "size-10 flex items-center justify-center shrink-0 border",
            bgColor,
            textColor,
            borderColor,
          )}
        >
          <MilestoneStatusIcon />
        </div>
        <Collapsible className="flex flex-col gap-4 flex-1 min-w-0">
          <CollapsibleTrigger
            nativeButton={false}
            className="flex items-start gap-4 cursor-pointer"
            render={
              <Card className="border flex-1 min-w-0 py-4">
                <CardContent className="flex-1 min-w-0 flex flex-col gap-0.5 px-4">
                  <span className="text-xl font-medium">{milestone.name}</span>
                  {milestone.description ? (
                    <p className="text-muted-foreground text-base">
                      {milestone.description}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <PlusIcon className="size-5 text-muted-foreground" />
                      <span className="text-muted-foreground text-base">
                        Add a description to explain the milestone and its
                        outcomes
                      </span>
                    </div>
                  )}
                  {milestone.dueAt && (
                    <div className="flex items-center gap-2 mt-1">
                      <CalendarDaysIcon className="text-muted-foreground size-5" />
                      <span className="text-base text-muted-foreground">
                        Due by{" "}
                        {format(
                          parse(milestone.dueAt, "yyyy-MM-dd", new Date()),
                          "PP",
                        )}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            }
          ></CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-l-3 px-5 py-4">
              {milestone.tasks.length ? (
                <div></div>
              ) : (
                <span className="text-base font-medium text-muted-foreground">
                  No tasks have been assigned to this milestone.
                </span>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm">
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
                  className="w-full h-auto py-2 px-3.5 justify-start bg-transparent focus:bg-destructive/10 dark:focus:bg-destructive/20"
                >
                  <Trash2Icon />
                  Delete
                </DeleteMilestoneButton>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};
