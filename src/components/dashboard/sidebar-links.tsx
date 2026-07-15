"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { LayoutDashboardIcon, CalendarIcon, SparklesIcon } from "lucide-react";

export const SidebarLinks = () => {
  const pathname = usePathname();

  const sidebarLinks = [
    {
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      href: "/dashboard",
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
  ];

  return (
    <SidebarMenu className="flex flex-col gap-2">
      {sidebarLinks.map((link) => (
        <SidebarMenuItem key={link.href} className="flex items-center gap-2">
          <SidebarMenuButton
            render={
              <Link href={link.href}>
                <link.icon className="size-5" />
                <span className="text-lg font-medium">{link.label}</span>
              </Link>
            }
            isActive={pathname === link.href}
          ></SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
};
