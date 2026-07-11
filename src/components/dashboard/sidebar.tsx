import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarLinks } from "./sidebar-links";
import { SidebarProfile } from "./sidebar-profile";

export const DashboardSidebar = () => {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="w-full min-w-0">
        <div className="w-full p-2">
          <h1 className="font-semibold text-3xl flex-1 min-w-0 truncate">
            <span className="text-primary">Prodo</span>desk
          </h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarLinks />
        </SidebarGroup>
      </SidebarContent>
      <SidebarProfile />
    </Sidebar>
  );
};
