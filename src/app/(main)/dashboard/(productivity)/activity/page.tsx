import { ErrorState } from "@/components/error-state";
import { readActivityAction } from "@/features/activity/actions/actions";
import { ActivityFilters } from "@/features/activity/components/activity-filters";
import { ActivityListSkeleton } from "@/features/activity/components/activity-list-skeleton";
import { ActivityListTable } from "@/features/activity/components/activity-list-table";
import { loadActivitySearchParams } from "@/features/activity/lib/activity-params";
import { SearchParamsType } from "@/lib/types";
import { Suspense } from "react";

const ActivityPage = (props: SearchParamsType) => {
  return (
    <div className="w-full h-full flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">My Activity</h1>
      <Suspense fallback={<ActivityListSkeleton />}>
        <ActivitySuspense {...props} />
      </Suspense>
    </div>
  );
};

const ActivitySuspense = async ({ searchParams }: SearchParamsType) => {
  const filters = await loadActivitySearchParams(searchParams);

  const response = await readActivityAction({ ...filters, cursor: null });
  if (!response) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your activity. Try refreshing the page or checking the URL."
      />
    );
  }

  const { metadata } = response;

  return (
    <div className="flex flex-col gap-4">
      <ActivityFilters />
      <ActivityListTable
        key={metadata.clientKey}
        response={response}
        showProject
      />
    </div>
  );
};

export default ActivityPage;
