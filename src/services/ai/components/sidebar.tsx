import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatList } from "@/features/chats/components/chat-list";
import { ChatSearchButton } from "@/features/chats/components/chat-search-button";
import { ChatSearchCommandDialog } from "@/features/chats/components/chat-search-command-dialog";
import { NewChatButton } from "@/features/chats/components/new-chat-button";

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
                <ChatSearchButton />
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
