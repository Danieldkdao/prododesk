"use client";

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { GetChatsActionReturnType } from "../actions/actions";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const SidebarChatItem = ({
  chat,
}: {
  chat: GetChatsActionReturnType[number];
}) => {
  const pathname = usePathname();

  return (
    <SidebarMenuItem className="w-full min-w-0">
      <SidebarMenuButton
        render={
          <Link
            href={`/dashboard/ai/chat/${chat.id}`}
            className="w-full min-w-0"
          >
            <span className="truncate">{chat.name}</span>
          </Link>
        }
        isActive={pathname.includes(chat.id)}
      />
    </SidebarMenuItem>
  );
};
