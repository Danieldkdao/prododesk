"use client";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { resources } from "@/lib/constants";
import { ResourceType, SetterType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const SearchCommandModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: SetterType<boolean>;
}) => {
  const [selectedResources, setSelectedResources] = useState<ResourceType[]>(
    [],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="flex flex-col gap-2 min-w-0 w-full">
        <CommandInput placeholder="Type a command or search..." />
        <div className="min-w-0 overflow-hidden w-full">
          <div className="min-w-0 flex items-center gap-2 px-2 pb-2 w-full overflow-x-auto scrollbar-none">
            {resources.map((resource) => {
              const isSelected = selectedResources.includes(resource.value);

              return (
                <button
                  key={resource.value}
                  className={cn(
                    "px-2 py-1 flex items-center gap-2 bg-muted-foreground/10 transition-color duration-200 text-muted-foreground hover:bg-muted-foreground/15 cursor-pointer",
                    isSelected &&
                      "bg-primary/10 text-primary hover:bg-primary/15",
                  )}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedResources((prev) =>
                        prev.filter((r) => r !== resource.value),
                      );
                    } else {
                      setSelectedResources((prev) => [...prev, resource.value]);
                    }
                  }}
                >
                  <resource.icon className="size-5" />
                  {resource.label}
                </button>
              );
            })}
          </div>
        </div>
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup></CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
};
