import { ErrorState } from "@/components/error-state";
import { readProjectActivityAction } from "@/features/activity/actions/actions";
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

  const activity = await readProjectActivityAction(projectId);
  if (!activity) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your project activity. Try refreshing the page or checking the URL."
      />
    );
  }

  return <div>{JSON.stringify(activity)}</div>;
};

export default ProjectIdActivityPage;
