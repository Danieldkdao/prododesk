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
            <SidebarGroupContent>
              {Array.from({ length: 5 }).map((_, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    render={
                      <Link href={`/dashboard/ai/chat/${index}`}>
                        <MessageCircleIcon />
                        <span>Chat {index + 1}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </SidebarHeader>
    </Sidebar>
  );
};
