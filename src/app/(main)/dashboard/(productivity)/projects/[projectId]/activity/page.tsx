import { ErrorState } from "@/components/error-state";
import { readActivityAction } from "@/features/activity/actions/actions";
import { ActivityFilters } from "@/features/activity/components/activity-filters";
import { ActivityListTable } from "@/features/activity/components/activity-list-table";
import { ActivityListSkeleton } from "@/features/activity/components/activity-list-skeleton";
import { loadActivitySearchParams } from "@/features/activity/lib/activity-params";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";

type ProjectIdActivityParams = ParamsId<"projectId"> & SearchParamsType;

const ProjectIdActivityPage = (props: ProjectIdActivityParams) => {
  return (
    <Suspense fallback={<ActivityListSkeleton />}>
      <ProjectIdActivitySuspense {...props} />
    </Suspense>
  );
};

const ProjectIdActivitySuspense = async ({
  params,
  searchParams,
}: ProjectIdActivityParams) => {
  const { projectId } = await params;

  const filters = await loadActivitySearchParams(searchParams);

  const response = await readActivityAction({
    ...filters,
    projectIds: [projectId],
    cursor: null,
  });
  if (!response) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your project activity. Try refreshing the page or checking the URL."
      />
    );
  }

  const { metadata } = response;

  return (
    <div className="flex flex-col gap-4 w-full">
      <ActivityFilters />
      <ActivityListTable
        key={metadata.clientKey}
        projectIds={[projectId]}
        response={response}
      />
    </div>
  );
};

export default ProjectIdActivityPage;
