"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TaskViewTab } from "../lib/types";
import { DEFAULT_TAB_VALUE, taskViewTabs } from "../lib/constants";

export const TaskViewTabs = ({ value }: { value: TaskViewTab }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = (newValue: TaskViewTab) => {
    if (newValue === DEFAULT_TAB_VALUE) {
      router.push(pathname);
      return;
    }
    const params = new URLSearchParams(searchParams);
    params.set("tab", newValue);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs
      value={value}
      onValueChange={(value) => handleTabChange(value as TaskViewTab)}
    >
      <TabsList>
        {taskViewTabs.map((tab) => (
          <TabsTrigger key={tab} value={tab}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
