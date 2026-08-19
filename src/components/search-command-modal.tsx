"use client";

import { CommandDialog } from "@/components/ui/command";
import { ResourcesCommandList } from "@/features/resources/components/resources-command-list";
import { SetterType } from "@/lib/types";

export const SearchCommandModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: SetterType<boolean>;
}) => {
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <ResourcesCommandList setOpen={setOpen} />
    </CommandDialog>
  );
};
