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
import { ComponentProps, ReactElement, useState } from "react";
import { ProjectForm } from "./project-form";
import { ProjectFormDefaultValues } from "../lib/types";

export const ProjectDialog = ({
  existingProject,
  defaultValues,
  children,
  open,
  onOpenChange,
  ...triggerProps
}: {
  existingProject?: ProjectSelectType;
  defaultValues?: ProjectFormDefaultValues;
  children?: ReactElement;
  open?: boolean;
  onOpenChange?: SetterType<boolean>;
} & Omit<ComponentProps<typeof DialogTrigger>, "render" | "children">) => {
  const [isOpen, setIsOpen] = useState(false);

  const openToUse = open ?? isOpen;
  const handleOpenChange = onOpenChange ?? setIsOpen;

  return (
    <Dialog open={openToUse} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger {...triggerProps} render={children} />}
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
          defaultValues={defaultValues}
          afterAction={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
