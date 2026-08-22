import { ErrorState } from "@/components/error-state";
import { LinkButton } from "@/components/link-button";
import { OverviewSuspenseEmptyData } from "@/components/overview-suspense-empty-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardActivityItem } from "@/features/activity/components/dashboard-activity-item";
import { ActivityIcon } from "lucide-react";
import { Suspense } from "react";
import { readDashboardActivityAction } from "../actions/actions";

export const RecentActivitySection = () => {
  return (
    <Suspense fallback={<RecentActivitySectionSkeleton />}>
      <RecentActivitySectionSuspense />
    </Suspense>
  );
};

export const RecentActivitySectionSkeleton = () => {
  return (
    <Card
      className="border-2 pt-6 pb-0 min-w-0 gap-0 h-full max-h-175 overflow-hidden"
      aria-label="Loading recent activity"
      aria-busy="true"
    >
      <CardHeader className="px-4 flex items-center gap-2 justify-between border-b">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-9 w-20" />
      </CardHeader>
      <CardContent className="px-0 min-w-0">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="border-y last:border-b-0 p-4">
            <div className="flex items-start gap-2 w-full min-w-0 leading-7">
              <span className="h-[1lh] flex items-center shrink-0">
                <Skeleton className="size-6 rounded-full" />
              </span>
              <div className="flex-1 min-w-0 flex flex-col gap-2 py-0.5">
                <Skeleton
                  className={index % 2 === 0 ? "h-5 w-full" : "h-5 w-4/5"}
                />
                {index % 2 === 0 && <Skeleton className="h-5 w-2/3" />}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const RecentActivitySectionSuspense = async () => {
  const activity = await readDashboardActivityAction();
  if (!activity)
    return (
      <ErrorState
        title="Failed to load activity"
        description="We were unable to load your recent activity. Try refreshing the page or come back later."
      />
    );

  return (
    <Card className="border-2 pt-6 pb-0 min-w-0 gap-0 h-full max-h-175 overflow-hidden">
      <CardHeader className="px-4 flex items-center gap-2 justify-between border-b">
        <CardTitle className="text-xl">Recent activity</CardTitle>
        <LinkButton href="/dashboard/activity" variant="ghost">
          View all
        </LinkButton>
      </CardHeader>
      {activity.length ? (
        <CardContent className="px-0 min-w-0">
          {activity.map((a) => (
            <div key={a.id} className="border-y last:border-b-0 p-4">
              <DashboardActivityItem activity={a} />
            </div>
          ))}
        </CardContent>
      ) : (
        <OverviewSuspenseEmptyData
          icon={ActivityIcon}
          title="No Recent Activity"
          description="You don't have any recent activity. Start exploring the platform to get started."
          className="border-none"
        />
      )}
    </Card>
  );
};
