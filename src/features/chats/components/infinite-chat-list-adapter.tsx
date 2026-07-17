"use client";

import { ChatTableSelectType } from "@/db/schema";
import { ReactNode } from "react";
import { SidebarChatItem } from "./sidebar-chat-item";
import { ChatSearchItem } from "./chat-search-item";
import { InfiniteChatList } from "../infinite-chat-list";

export type ChatListVariant = "sidebar" | "search";

export const InfiniteChatListAdapter = ({
  variant,
  ...props
}: {
  variant: ChatListVariant;
  userId: string;
  useSearch: boolean;
  initialChats: ChatTableSelectType[];
  initialHasNextPage: boolean;
  skeleton: ReactNode;
}) => {
  const ChatItem = (chat: ChatTableSelectType) => {
    switch (variant) {
      case "sidebar":
        return <SidebarChatItem chat={chat} />;
      case "search":
        return <ChatSearchItem chat={chat} />;
      default:
        throw new Error(
          `Unknown chat list variant: ${variant satisfies never}`,
        );
    }
  };

  return <InfiniteChatList {...props} ChatItem={ChatItem} />;
};
