import { Kbd } from "@/components/ui/kbd";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatList } from "@/features/chats/components/chat-list";
import { ChatSearchCommandDialog } from "@/features/chats/components/chat-search-command-dialog";
import { NewChatButton } from "@/features/chats/components/new-chat-button";
import { CommandIcon, SearchIcon } from "lucide-react";

export const AISidebar = () => {
  return (
    <Sidebar contained collapsible="icon" className="border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenuItem>
              <NewChatButton />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <ChatSearchCommandDialog>
                <SidebarMenuButton
                  tooltip="Search chats"
                  className="flex items-center gap-2 w-full"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <SearchIcon />
                    <span>Search chats</span>
                  </div>
                  <Kbd className="text-sm">
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
    </Sidebar>
  );
};
