"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProjectSelectType } from "@/db/schema";
import { SetterType } from "@/lib/types";
import { ReactElement, useState } from "react";
import { ProjectForm } from "./project-form";

export const ProjectDialog = ({
  existingProject,
  children,
  open,
  onOpenChange,
}: {
  existingProject?: ProjectSelectType & {
    area?: { name: string; icon?: string | null } | null;
  };
  children?: ReactElement;
  open?: boolean;
  onOpenChange?: SetterType<boolean>;
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
            {existingProject ? "Update Project" : "Create Project"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {existingProject ? "Update Project" : "Create Project"}
          </DialogDescription>
        </DialogHeader>
        <ProjectForm
          existingProject={existingProject}
          afterAction={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
