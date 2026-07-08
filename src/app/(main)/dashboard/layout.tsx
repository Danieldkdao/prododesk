import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="h-dvh w-full flex">
        <DashboardSidebar />
        <div className="h-full flex-1 w-full flex flex-col">
          <div className="p-4 border-b">Header goes here</div>
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
