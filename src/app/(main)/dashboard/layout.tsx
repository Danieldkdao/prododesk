import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="h-dvh w-full flex">
        <DashboardSidebar />
        <div className="h-full flex-1 w-full flex flex-col">
          <DashboardHeader />
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
