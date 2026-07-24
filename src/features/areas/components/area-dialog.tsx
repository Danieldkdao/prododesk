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
  manualOpen,
  setManualOpen,
}: {
  existingArea?: AreaSelectType;
  children?: ReactElement;
  manualOpen?: boolean;
  setManualOpen?: SetterType<boolean>;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={children ? open : (manualOpen ?? open)}
      onOpenChange={children ? setOpen : setManualOpen}
    >
      {children && <DialogTrigger render={children} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existingArea ? "Update area" : "Create area"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {existingArea ? "Update area" : "Create area"}
          </DialogDescription>
        </DialogHeader>
        <AreaForm
          existingArea={existingArea}
          afterAction={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
