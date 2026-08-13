import { ErrorState } from "@/components/error-state";
import { readActivityAction } from "@/features/activity/actions/actions";
import { ActivityFilters } from "@/features/activity/components/activity-filters";
import { ActivityListTable } from "@/features/activity/components/activity-list-table";
import { ActivityProjectSectionSkeleton } from "@/features/activity/components/activity-project-section-skeleton";
import { loadActivitySearchParams } from "@/features/activity/lib/activity-params";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";

type AreaIdActivityParams = ParamsId<"areaId"> & SearchParamsType;

const AreaIdActivityPage = (props: AreaIdActivityParams) => {
  return (
    <Suspense fallback={<ActivityProjectSectionSkeleton showProject />}>
      <AreaIdActivitySuspense {...props} />
    </Suspense>
  );
};

const AreaIdActivitySuspense = async ({
  params,
  searchParams,
}: AreaIdActivityParams) => {
  const { areaId } = await params;
  const filters = await loadActivitySearchParams(searchParams);

  const response = await readActivityAction({
    ...filters,
    areaIds: [areaId],
  });
  if (!response) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your activity in this area. Try refreshing the page or checking the URL."
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

export default AreaIdActivityPage;
