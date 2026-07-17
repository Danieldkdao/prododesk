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
import { SidebarChatList } from "@/features/chats/components/sidebar-chat-list";
import { EditIcon, MessageCircleIcon, SearchIcon } from "lucide-react";
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
                <SidebarMenuButton
                  render={
                    <Link href="/dashboard/ai/new">
                      <SearchIcon />
                      <span>Search chats</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarChatList />
          </SidebarGroup>
        </SidebarContent>
      </SidebarHeader>
    </Sidebar>
  );
};
