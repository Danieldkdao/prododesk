"use client";

import { CommandItemLink } from "@/components/ui/command";
import { ChatTableSelectType } from "@/db/schema";
import { MessageCircleIcon } from "lucide-react";

export const ChatSearchItem = ({ chat }: { chat: ChatTableSelectType }) => {
  return (
    <CommandItemLink
      href={`/dashboard/ai/chat/${chat.id}`}
      className="w-full min-w-0 flex items-center gap-2"
    >
      <MessageCircleIcon />
      <span className="truncate flex-1 min-w-0">{chat.name}</span>
    </CommandItemLink>
  );
};
