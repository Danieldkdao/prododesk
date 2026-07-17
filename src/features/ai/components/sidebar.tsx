import { Kbd } from "@/components/ui/kbd";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatList } from "@/features/chats/components/chat-list";
import { ChatSearchCommandDialog } from "@/features/chats/components/chat-search-command-dialog";
import { SidebarChatItem } from "@/features/chats/components/sidebar-chat-item";
import { CommandIcon, EditIcon, SearchIcon } from "lucide-react";
import Link from "next/link";

export const AISidebar = () => {
  return (
    <Sidebar contained collapsible="icon" className="border">
      <SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <Link href="/dashboard/ai/new">
                      <EditIcon />
                      <span>New chat</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <ChatSearchCommandDialog>
                  <SidebarMenuButton className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <SearchIcon />
                      <span>Search chats</span>
                    </div>
                    <Kbd>
                      <CommandIcon className="size-4" />K
                    </Kbd>
                  </SidebarMenuButton>
                </ChatSearchCommandDialog>
              </SidebarMenuItem>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <ChatList
                variant="sidebar"
                skeleton={
                  <SidebarMenuItem>
                    <Skeleton className="mx-3 my-2 h-4 w-full rounded-none" />
                  </SidebarMenuItem>
                }
              />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </SidebarHeader>
    </Sidebar>
  );
};
