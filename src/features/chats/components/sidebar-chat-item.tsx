"use client";

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { GetChatsActionReturnType } from "../actions/actions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatOptions } from "./chat-options";
import { EllipsisVerticalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const SidebarChatItem = ({
  chat,
}: {
  chat: GetChatsActionReturnType["chats"][number];
}) => {
  const pathname = usePathname();

  return (
    <SidebarMenuItem className="w-full min-w-0">
      <SidebarMenuButton
        render={
          <div className="w-full min-w-0 flex items-center gap-1">
            <Link
              href={`/dashboard/ai/chat/${chat.id}`}
              className="min-w-0 flex-1 truncate"
            >
              <span>{chat.name}</span>
            </Link>
            <ChatOptions chat={chat} align="end" side="right" sideOffset={8}>
              <Button
                variant="ghost"
                size="icon-xs"
                className="pointer-events-none shrink-0 bg-transparent opacity-0 transition-opacity hover:bg-transparent! group-hover/menu-item:pointer-events-auto group-hover/menu-item:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 data-popup-open:pointer-events-auto data-popup-open:opacity-100"
              >
                <EllipsisVerticalIcon />
              </Button>
            </ChatOptions>
          </div>
        }
        isActive={pathname.includes(chat.id)}
      />
    </SidebarMenuItem>
  );
};
