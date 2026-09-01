import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TaskDetailsDialog } from "@/features/tasks/components/task-details-dialog";
import { TaskDetailsDialogProvider } from "@/features/tasks/hooks/use-task-details-dialog";
import { AuthSyncProvider } from "@/hooks/use-auth-sync-provider";
import { ReactNode } from "react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <TaskDetailsDialogProvider>
      <AuthSyncProvider>
        <SidebarProvider iconsOnly>
          <div className="h-dvh w-full flex flex-col min-h-0 overflow-hidden bg-accent/40">
            <DashboardHeader />
            <div className="relative h-full flex-1 w-full flex min-h-0 overflow-hidden">
              <DashboardSidebar />
              <div className="flex-1 h-full w-full min-w-0 min-h-0 overflow-hidden">
                {children}
              </div>
            </div>
          </div>
        </SidebarProvider>
      </AuthSyncProvider>
      <TaskDetailsDialog />
    </TaskDetailsDialogProvider>
  );
};

export default DashboardLayout;
