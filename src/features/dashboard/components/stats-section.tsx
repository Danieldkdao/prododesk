import { ErrorState } from "@/components/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { TaskStatus } from "@/db/shared";
import { cn } from "@/lib/utils";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleStarIcon,
} from "lucide-react";
import { Suspense } from "react";
import { readDashboardStatsAction } from "../actions/actions";

export const StatsSection = () => {
  return (
    <Suspense fallback={<StatsSectionLoading />}>
      <StatsSectionSuspense />
    </Suspense>
  );
};

const StatsSectionLoading = () => {
  return <div>loading</div>;
};

const StatsSectionSuspense = async () => {
  const statsData = await readDashboardStatsAction();
  if (!statsData)
    return (
      <ErrorState
        title="Something went wrong"
        description="We were unable to load your stats data. Try refreshing the page or come back later."
      />
    );

  const taskStatusCounts = Object.fromEntries(
    statsData.taskStatusCounts.map(({ count, status }) => [status, count]),
  ) as Record<TaskStatus, number>;
  const completedTaskCount = taskStatusCounts.completed || 0;
  const totalTaskCount = statsData.taskStatusCounts.reduce(
    (acc, { count }) => acc + count,
    0,
  );

  const openTaskCount = totalTaskCount - completedTaskCount;
  const overdueTaskCount = statsData.overdueTaskCount;
  const activeProjectCount = statsData.activeProjectCount;

  const stats = [
    {
      label: "Open tasks",
      value: openTaskCount,
      icon: CircleDashedIcon,
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Completed tasks",
      value: completedTaskCount,
      icon: CircleCheckIcon,
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Overdue tasks",
      value: overdueTaskCount,
      icon: CircleAlertIcon,
      textColor: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Active projects",
      value: activeProjectCount,
      icon: CircleStarIcon,
      textColor: "text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-2 py-4 min-w-0">
          <CardContent className="flex items-center gap-4 px-4">
            <stat.icon className={cn("size-14 shrink-0", stat.textColor)} />
            <div className="flex flex-col gap-px">
              <span className={cn("text-3xl font-semibold", stat.textColor)}>
                {stat.value}
              </span>
              <span className="text-muted-foreground font-medium text-lg">
                {stat.label}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
