"use client";

import { Button } from "@/components/ui/button";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { EllipsisVerticalIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GetChatsActionReturnType } from "../actions/actions";
import { ChatOptions } from "./chat-options";

export const SidebarChatItem = ({
  chat,
}: {
  chat: GetChatsActionReturnType["chats"][number];
}) => {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();

  return (
    <SidebarMenuItem className="w-full min-w-0">
      <SidebarMenuButton
        tooltip={chat.name}
        render={
          <div className="w-full min-w-0 flex items-center gap-1">
            <Link
              href={`/dashboard/ai/chat/${chat.id}`}
              className="min-w-0 flex-1 flex items-center gap-2"
            >
              {state !== "expanded" && (isMobile || !isMobile) && (
                <MessageCircleIcon className="size-5" />
              )}
              <span className="flex-1 truncate">{chat.name}</span>
            </Link>
            {state === "expanded" && (isMobile || !isMobile) && (
              <ChatOptions chat={chat} align="end" side="right" sideOffset={8}>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="pointer-events-none shrink-0 bg-transparent opacity-0 transition-opacity hover:bg-transparent! group-hover/menu-item:pointer-events-auto group-hover/menu-item:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 data-popup-open:pointer-events-auto data-popup-open:opacity-100"
                >
                  <EllipsisVerticalIcon />
                </Button>
              </ChatOptions>
            )}
          </div>
        }
        isActive={pathname.includes(chat.id)}
      />
    </SidebarMenuItem>
  );
};
