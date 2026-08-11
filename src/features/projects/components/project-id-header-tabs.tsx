"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReadProjectActionReturnType } from "../actions/actions";
import { formatColor } from "@/lib/formatters";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ProjectIdHeaderTabs = ({
  project,
}: {
  project: ReadProjectActionReturnType;
}) => {
  const pathname = usePathname();
  const { bg, dataActiveText, afterBg, hoverText } = formatColor(project.color);

  const tabs = [
    {
      value: "overview",
      children: "Overview",
      href: "",
    },
    {
      value: "tasks",
      children: (
        <div className="flex items-center gap-2 group">
          <span>Tasks</span>
          <div
            className={cn(bg, "py-0.5 px-1 flex items-center justify-center")}
          >
            <span className="text-white! font-medium text-sm">
              {project.taskCounts.reduce((a, b) => a + b.count, 0)}
            </span>
          </div>
        </div>
      ),
      href: "/tasks",
    },
    {
      value: "milestones",
      children: "Milestones",
      href: "/milestones",
    },
    {
      value: "documents",
      children: "Documents",
      href: "/documents",
    },
    {
      value: "activity",
      children: "Activity",
      href: "/activity",
    },
  ];

  const currentTab = tabs.find(
    (tab) => `/dashboard/projects/${project.id}${tab.href}` === pathname,
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
                  <Link href={`/dashboard/projects/${project.id}${tab.href}`}>
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
                <Link href={`/dashboard/projects/${project.id}${tab.href}`}>
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
