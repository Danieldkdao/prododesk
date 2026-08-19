import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { SidebarLinks } from "./sidebar-links";
import { Suspense } from "react";

const DashboardSidebarSkeleton = () => {
  return (
    <SidebarMenu className="flex flex-col gap-2" aria-busy="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <SidebarMenuItem key={index}>
          <SidebarMenuSkeleton showIcon className="h-9 px-3" />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
};

export const DashboardSidebar = () => {
  return (
    <Sidebar collapsible="icon" contained>
      <SidebarContent>
        <SidebarGroup>
          <Suspense fallback={<DashboardSidebarSkeleton />}>
            <SidebarLinks />
          </Suspense>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
