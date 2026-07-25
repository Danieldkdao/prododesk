"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AreaSelectType } from "@/db/schema";
import { ReactElement, useState } from "react";
import { AreaForm } from "./area-form";
import { SetterType } from "@/lib/types";

export const AreaDialog = ({
  existingArea,
  children,
  open,
  onOpenChange,
}: {
  existingArea?: AreaSelectType;
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
            {existingArea ? "Update Area" : "Create Area"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {existingArea ? "Update Area" : "Create Area"}
          </DialogDescription>
        </DialogHeader>
        <AreaForm
          existingArea={existingArea}
          afterAction={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
