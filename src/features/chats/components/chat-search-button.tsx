"use client";

import { Kbd } from "@/components/ui/kbd";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useDialogStateStore } from "@/store/use-dialog-state-store";
import { ArrowBigUpIcon, CommandIcon, SearchIcon } from "lucide-react";
import { useEffect } from "react";

export const ChatSearchButton = () => {
  const setOpen = useDialogStateStore((state) => state.setOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "k" &&
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        !e.altKey
      ) {
        e.preventDefault();

        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  return (
    <SidebarMenuButton
      tooltip="Search chats"
      className="flex items-center gap-2 w-full"
      onClick={() => setOpen(true)}
    >
      <div className="flex items-center gap-2 flex-1">
        <SearchIcon />
        <span>Search chats</span>
      </div>
      <Kbd className="text-sm">
        <CommandIcon className="size-4" />
        <ArrowBigUpIcon className="size-4" />K
      </Kbd>
    </SidebarMenuButton>
  );
};
