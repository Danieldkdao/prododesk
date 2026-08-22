import { ErrorState } from "@/components/error-state";
import { LinkButton } from "@/components/link-button";
import { OverviewSuspenseEmptyData } from "@/components/overview-suspense-empty-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DashboardActivityItem } from "@/features/activity/components/dashboard-activity-item";
import { ActivityIcon } from "lucide-react";
import { Fragment, Suspense } from "react";
import { readDashboardActivityAction } from "../actions/actions";

export const RecentActivitySection = () => {
  return (
    <Suspense fallback={<RecentActivitySectionLoading />}>
      <RecentActivitySectionSuspense />
    </Suspense>
  );
};

const RecentActivitySectionLoading = () => {
  return <div>loading</div>;
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
