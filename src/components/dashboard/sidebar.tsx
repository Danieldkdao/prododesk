import { Sidebar, SidebarContent, SidebarGroup } from "@/components/ui/sidebar";
import { SidebarLinks } from "./sidebar-links";

export const DashboardSidebar = () => {
  return (
    <Sidebar collapsible="icon" contained>
      <SidebarContent>
        <SidebarGroup>
          <SidebarLinks />
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
