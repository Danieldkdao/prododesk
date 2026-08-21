import Image from "next/image";
import { SidebarTrigger } from "../ui/sidebar";
import { WorkspaceSearch } from "../workspace-search";
import { UserProfile } from "./user-profile";

export const DashboardHeader = () => {
  return (
    <header className="border-b py-2 px-4 flex items-center gap-4 w-full">
      <div className="flex items-center gap-2 shrink-0">
        <Image src="/logo.png" alt="Logo" width={32} height={32} />
        <h1 className="truncate text-2xl font-semibold hidden md:block">
          ProdoDesk
        </h1>
      </div>
      <div className="w-full flex-1 flex justify-center">
        <WorkspaceSearch />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <SidebarTrigger />
        <UserProfile />
      </div>
    </header>
  );
};
