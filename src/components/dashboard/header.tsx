import { WorkspaceSearch } from "../workspace-search";
import { UserProfile } from "./user-profile";

export const DashboardHeader = () => {
  return (
    <header className="border-b py-2 px-4 grid grid-cols-3 gap-2 items-center">
      <h1 className="text-2xl font-semibold">ProdoDesk</h1>
      <WorkspaceSearch />
      <div className="flex items-center w-full justify-end">
        <UserProfile />
      </div>
    </header>
  );
};
