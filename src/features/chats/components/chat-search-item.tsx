"use client";

import { CommandItemLink } from "@/components/ui/command";
import { ChatTableSelectType } from "@/db/schema";
import { MessageCircleIcon } from "lucide-react";

export const ChatSearchItem = ({ chat }: { chat: ChatTableSelectType }) => {
  return (
    <CommandItemLink href={`/dashboard/ai/chat/${chat.id}`}>
      <MessageCircleIcon />
      <span>{chat.name}</span>
    </CommandItemLink>
  );
};
