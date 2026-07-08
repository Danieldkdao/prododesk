import { ThemeToggle } from "../theme-toggle";
import { SidebarTrigger } from "../ui/sidebar";

export const DashboardHeader = () => {
  return (
    <header className="border-b p-2 flex items-center gap-2 justify-between">
      <SidebarTrigger />
      <ThemeToggle />
    </header>
  );
};
