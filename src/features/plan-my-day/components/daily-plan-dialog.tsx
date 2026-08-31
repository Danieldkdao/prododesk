"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ReactElement } from "react";
import { useForm } from "react-hook-form";

export const DailyPlanDialog = ({ children }: { children: ReactElement }) => {
  return (
    <Dialog>
      <DialogTrigger render={children} />
      <DialogContent
        className="min-w-0 sm:max-w-3xl @container"
        showCloseButton={false}
      >
        <form></form>
      </DialogContent>
    </Dialog>
  );
};
