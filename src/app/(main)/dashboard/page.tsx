import { ErrorState } from "@/components/error-state";
import { NextUpSection } from "@/features/dashboard/components/next-up-section";
import { NextUpSectionSkeleton } from "@/features/dashboard/components/next-up-section";
import {
  ProjectsSection,
  ProjectsSectionSkeleton,
} from "@/features/dashboard/components/projects-section";
import {
  RecentActivitySection,
  RecentActivitySectionSkeleton,
} from "@/features/dashboard/components/recent-activity-section";
import {
  StatsSection,
  StatsSectionSkeleton,
} from "@/features/dashboard/components/stats-section";
import {
  TodayTasksSection,
  TodayTasksSectionSkeleton,
} from "@/features/dashboard/components/today-tasks-section";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/helpers";
import { Suspense } from "react";
import { LinkButton } from "@/components/link-button";
import { PlanMyDayCard } from "@/features/plan-my-day/components/plan-my-day-card";

const DashboardPage = () => {
  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="flex flex-col gap-4 p-10 max-w-384 mx-auto">
        <Suspense fallback={<DashboardLoading />}>
          <DashboardSuspense />
        </Suspense>
      </div>
    </div>
  );
};

const DashboardLoading = () => {
  return (
    <div className="w-full min-w-0 flex flex-col gap-8" aria-busy="true">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-7 w-96 max-w-full" />
      </div>
      <StatsSectionSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <TodayTasksSectionSkeleton />
        <NextUpSectionSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <ProjectsSectionSkeleton />
        <RecentActivitySectionSkeleton />
      </div>
    </div>
  );
};

const DashboardSuspense = async () => {
  const { user } = await getCurrentUser();
  if (!user)
    return (
      <ErrorState
        title="Unauthorized Error"
        description="Please sign in to view this page"
      >
        <LinkButton href="/sign-in">Sign In</LinkButton>
      </ErrorState>
    );

  return (
    <div className="w-full min-w-0 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold">
          Welcome, {user.name.split(" ").at(0)}.
        </h1>
        <p className="text-muted-foreground text-xl">
          What would you like to work on today?
        </p>
      </div>
      <PlanMyDayCard />
      <StatsSection />
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <TodayTasksSection />
        <NextUpSection />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <ProjectsSection />
        <RecentActivitySection />
      </div>
    </div>
  );
};

export default DashboardPage;
