import { Sidebar, SidebarContent, SidebarGroup } from "@/components/ui/sidebar";
import { SidebarLinks } from "./sidebar-links";
import { Suspense } from "react";

export const DashboardSidebar = () => {
  return (
    <Sidebar collapsible="icon" contained>
      <SidebarContent>
        <SidebarGroup>
          <Suspense>
            <SidebarLinks />
          </Suspense>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
