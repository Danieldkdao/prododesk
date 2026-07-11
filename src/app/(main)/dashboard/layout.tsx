import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <SidebarProvider forceMobile>
      <div className="h-dvh w-full flex min-h-0 overflow-hidden">
        <DashboardSidebar />
        <div className="h-full flex-1 w-full flex flex-col min-h-0 overflow-hidden">
          <DashboardHeader />
          <div className="flex-1 h-full min-h-0 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
