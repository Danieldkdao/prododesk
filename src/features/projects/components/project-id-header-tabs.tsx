"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReadProjectActionReturnType } from "../actions/actions";
import { formatColor } from "@/lib/formatters";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
        <div className="flex items-center gap-2">
          <span>Tasks</span>
          <div className={cn(bg, "size-5 flex items-center justify-center")}>
            <span className="text-white font-medium text-base">
              {project.tasks.length}
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

  const tabValue = tabs.find(
    (tab) => `/dashboard/projects/${project.id}${tab.href}` === pathname,
  )?.value;

  return (
    <Tabs defaultValue={tabValue ?? "overview"} value={tabValue}>
      <TabsList variant="line">
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
  );
};
