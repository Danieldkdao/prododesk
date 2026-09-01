"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import {
  LayoutDashboardIcon,
  CalendarIcon,
  SparklesIcon,
  ShapesIcon,
  FolderKanbanIcon,
  FileTextIcon,
  ListCheckIcon,
  SettingsIcon,
} from "lucide-react";

export const SidebarLinks = () => {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const sidebarLinks = [
    {
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      href: "/dashboard",
    },
    {
      label: "Tasks",
      icon: ListCheckIcon,
      href: "/dashboard/tasks",
    },
    {
      label: "Areas",
      icon: ShapesIcon,
      href: "/dashboard/areas",
    },
    {
      label: "Projects",
      icon: FolderKanbanIcon,
      href: "/dashboard/projects",
    },
    {
      label: "Documents",
      icon: FileTextIcon,
      href: "/dashboard/documents",
    },
    {
      label: "Calendar",
      icon: CalendarIcon,
      href: "/dashboard/calendar",
    },
    {
      label: "Prododesk AI",
      icon: SparklesIcon,
      href: "/dashboard/ai/new",
    },
    {
      label: "Settings",
      icon: SettingsIcon,
      href: "/dashboard/settings",
    },
  ];

  return (
    <SidebarMenu className="flex flex-col gap-2">
      {sidebarLinks.map((link) => (
        <SidebarMenuItem key={link.href} className="flex items-center gap-2">
          <SidebarMenuButton
            tooltip={link.label}
            render={
              <Link href={link.href} onClick={() => setOpenMobile(false)}>
                <link.icon className="size-5" />
                <span className="text-lg font-medium">{link.label}</span>
              </Link>
            }
            isActive={pathname === link.href}
          />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
};
