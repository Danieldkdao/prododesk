import { WorkspaceSearch } from "../workspace-search";
import { SidebarTrigger } from "../ui/sidebar";
import { UserProfile } from "./user-profile";

export const DashboardHeader = () => {
  return (
    <header className="border-b py-2 px-4 grid grid-cols-3 gap-2 items-center">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />
        <h1 className="truncate text-2xl font-semibold">ProdoDesk</h1>
      </div>
      <WorkspaceSearch />
      <div className="flex items-center w-full justify-end">
        <UserProfile />
      </div>
    </header>
  );
};
