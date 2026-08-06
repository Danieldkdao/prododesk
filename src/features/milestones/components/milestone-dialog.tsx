"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MilestoneSelectType } from "@/db/schema";
import { SetterType } from "@/lib/types";
import { ReactElement, useState } from "react";
import { MilestoneForm } from "./milestone-form";

export const MilestoneDialog = ({
  projectId,
  existingMilestone,
  open,
  onOpenChange,
  children,
}: {
  projectId: string;
  existingMilestone?: MilestoneSelectType;
  open?: boolean;
  onOpenChange?: SetterType<boolean>;
  children?: ReactElement;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openToUse = open ?? isOpen;
  const handleOpenChange = onOpenChange ?? setIsOpen;

  return (
    <Dialog open={openToUse} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger render={children} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existingMilestone ? "Update Milestone" : "Create Milestone"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {existingMilestone ? "Update Milestone" : "Create Milestone"}
          </DialogDescription>
        </DialogHeader>
        <MilestoneForm
          projectId={projectId}
          existingMilestone={existingMilestone}
          afterAction={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
