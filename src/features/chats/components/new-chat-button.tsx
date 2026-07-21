"use client";

import { Kbd } from "@/components/ui/kbd";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { ArrowBigUpIcon, CommandIcon, EditIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const NewChatButton = () => {
  const router = useRouter();
  useEffect(() => {
    const handleNewChat = (e: KeyboardEvent) => {
      const isShortcut =
        e.key.toLowerCase() === "o" && (e.ctrlKey || e.metaKey) && e.shiftKey;

      if (!isShortcut) return;

      e.preventDefault();
      e.stopPropagation();

      router.push("/dashboard/ai/new");
    };

    window.addEventListener("keydown", handleNewChat, true);

    return () => window.removeEventListener("keydown", handleNewChat, true);
  }, [router]);

  return (
    <SidebarMenuButton
      tooltip="New chat"
      render={
        <Link
          href="/dashboard/ai/new"
          className="w-full min-w-0 flex items-center gap-2"
        >
          <div className="flex items-center gap-2 flex-1">
            <EditIcon />
            <span>New chat</span>
          </div>
          <Kbd className="text-sm">
            <CommandIcon className="size-4" />
            <ArrowBigUpIcon className="size-4" />O
          </Kbd>
        </Link>
      }
    />
  );
};
