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
import {
  ArrowBigUpIcon,
  CommandIcon,
  EditIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";

export const AISidebar = () => {
  return (
    <Sidebar contained collapsible="icon" className="border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="New chat"
                render={
                  <Link
                    href="/dashboard/ai/new"
                    className="w-full min-w-0 flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <EditIcon />
                      <span>New chat</span>
                    </div>
                    <Kbd className="text-sm">
                      <CommandIcon className="size-4" />
                      <ArrowBigUpIcon className="size-4" />O
                    </Kbd>
                  </Link>
                }
              />
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
