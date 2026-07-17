import { SidebarGroupContent, SidebarMenuItem } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/auth/helpers";
import { Suspense } from "react";
import { getChatsAction } from "../actions/actions";
import { SidebarChatItem } from "./sidebar-chat-item";
import { Skeleton } from "@/components/ui/skeleton";

export const SidebarChatList = () => {
  return (
    <Suspense fallback={<SidebarChatListLoading />}>
      <SidebarChatListSuspense />
    </Suspense>
  );
};

const SidebarChatListLoading = () => {
  return (
    <SidebarGroupContent>
      {Array.from({ length: 6 }).map((_, index) => (
        <SidebarMenuItem key={index}>
          <Skeleton className="mx-3 my-2 h-4 w-32 rounded-none" />
        </SidebarMenuItem>
      ))}
    </SidebarGroupContent>
  );
};

const SidebarChatListSuspense = async () => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const chats = await getChatsAction(userId);

  // todo: add infinite scrolling
  // todo: add chat actions (update, delete etc.)

  return (
    <SidebarGroupContent>
      {chats.map((chat) => (
        <SidebarChatItem key={chat.id} chat={chat} />
      ))}
    </SidebarGroupContent>
  );
};
