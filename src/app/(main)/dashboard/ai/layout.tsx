import { SidebarProvider } from "@/components/ui/sidebar";
import { AISidebar } from "@/features/ai/components/sidebar";
import { ReactNode } from "react";

const DashboardAILayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative w-full h-full min-w-0 min-h-0 p-10">
      <div className="relative w-full min-w-0 h-full min-h-0">
        <SidebarProvider
          enableShortcut={false}
          className="w-full h-full min-h-0 min-w-0 flex items-center gap-8"
        >
          <AISidebar />
          <div className="w-full h-full min-h-0 flex-1">{children}</div>
        </SidebarProvider>
      </div>
    </div>
  );
};

export default DashboardAILayout;
