import { ErrorState } from "@/components/error-state";
import { readProjectActivityAction } from "@/features/activity/actions/actions";
import { ActivityProjectTable } from "@/features/activity/components/activity-project-table";
import { loadActivitySearchParams } from "@/features/activity/lib/activity-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";

type ProjectIdActivityParams = ParamsId<"projectId"> & SearchParamsType;

const ProjectIdActivityPage = (props: ProjectIdActivityParams) => {
  return (
    <Suspense>
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

  const response = await readProjectActivityAction(projectId, filters);
  if (!response) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your project activity. Try refreshing the page or checking the URL."
      />
    );
  }

  const { activity, metadata } = response;

  return (
    <div className="flex flex-col gap-4 w-full">
      <ActivityProjectTable key={metadata.clientKey} response={response} />
    </div>
  );
};

export default ProjectIdActivityPage;
