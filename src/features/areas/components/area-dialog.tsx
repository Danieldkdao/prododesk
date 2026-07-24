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

export const AreaDialog = ({
  existingArea,
  children,
}: {
  existingArea?: AreaSelectType;
  children: ReactElement;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader className="sr-only">
          <DialogTitle>
            {existingArea ? "Update area" : "Create area"}
          </DialogTitle>
          <DialogDescription>
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
