"use client";

import { usePathname } from "next/navigation";
import { ReadAreaActionReturnType } from "../actions/actions";
import { formatColor } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ActivityIcon,
  FileTextIcon,
  FolderKanbanIcon,
  LayoutDashboardIcon,
  ListCheckIcon,
} from "lucide-react";

export const AreaIdHeaderTabs = ({
  area,
}: {
  area: ReadAreaActionReturnType;
}) => {
  const pathname = usePathname();
  const { bg, dataActiveText, afterBg, hoverText } = formatColor(area.color);

  const tabs = [
    {
      value: "overview",
      children: (
        <div className="flex items-center gap-2">
          <LayoutDashboardIcon className="size-5" />
          <span>Overview</span>
        </div>
      ),
      href: "",
    },
    {
      value: "projects",
      children: (
        <div className="flex items-center gap-2 group">
          <FolderKanbanIcon className="size-5" />
          <span>Projects</span>
          <div
            className={cn(bg, "py-0.5 px-1 flex items-center justify-center")}
          >
            <span className="text-white! font-medium text-sm">
              {area.projectCounts.reduce((a, b) => a + b.count, 0)}
            </span>
          </div>
        </div>
      ),
      href: "/projects",
    },
    {
      value: "tasks",
      children: (
        <div className="flex items-center gap-2 group">
          <ListCheckIcon className="size-5" />
          <span>Tasks</span>
          <div
            className={cn(bg, "py-0.5 px-1 flex items-center justify-center")}
          >
            <span className="text-white! font-medium text-sm">
              {area.taskCounts.reduce((a, b) => a + b.count, 0)}
            </span>
          </div>
        </div>
      ),
      href: "/tasks",
    },
    {
      value: "documents",
      children: (
        <div className="flex items-center gap-2">
          <FileTextIcon className="size-5" />
          <span>Documents</span>
        </div>
      ),
      href: "/documents",
    },
    {
      value: "activity",
      children: (
        <div className="flex items-center gap-2">
          <ActivityIcon className="size-5" />
          <span>Activity</span>
        </div>
      ),
      href: "/activity",
    },
  ];

  const currentTab = tabs.find(
    (tab) => `/dashboard/areas/${area.id}${tab.href}` === pathname,
  );
  const tabValue = currentTab?.value;

  return (
    <div className="w-full min-w-0">
      <Tabs defaultValue={tabValue ?? "overview"} value={tabValue}>
        <TabsList variant="line" className="hidden md:block">
          {tabs.map((tab) => {
            return (
              <TabsTrigger
                key={tab.value}
                nativeButton={false}
                value={tab.value}
                className={cn(
                  dataActiveText,
                  hoverText,
                  afterBg,
                  "text-base font-bold",
                )}
                render={
                  <Link href={`/dashboard/areas/${area.id}${tab.href}`}>
                    {tab.children}
                  </Link>
                }
              />
            );
          })}
        </TabsList>
      </Tabs>
      <Select>
        <SelectTrigger
          value={tabValue}
          className="w-full border-none md:hidden"
        >
          <SelectValue className="text-base font-bold uppercase">
            {currentTab?.children}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {tabs.map((tab) => (
            <SelectItem
              key={tab.value}
              value={tab.value}
              className="text-base font-bold uppercase"
              render={
                <Link href={`/dashboard/areas/${area.id}${tab.href}`}>
                  {tab.children}
                </Link>
              }
            />
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
