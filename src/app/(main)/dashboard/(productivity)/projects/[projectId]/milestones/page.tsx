import { ErrorState } from "@/components/error-state";
import { readProjectMilestonesAction } from "@/features/milestones/actions/actions";
import { MilestoneFilters } from "@/features/milestones/components/milestone-filters";
import { ParamsId } from "@/lib/types";
import { Suspense } from "react";

type ProjectIdMilestonesProps = ParamsId<"projectId">;

const ProjectIdMilestonesPage = (props: ProjectIdMilestonesProps) => {
  return (
    <Suspense fallback={<ProjectIdMilestonesLoading />}>
      <ProjectIdMilestonesSuspense {...props} />
    </Suspense>
  );
};

const ProjectIdMilestonesLoading = () => {
  return <div>loading</div>;
};

const ProjectIdMilestonesSuspense = async ({
  params,
}: ProjectIdMilestonesProps) => {
  const { projectId } = await params;
  const response = await readProjectMilestonesAction(projectId);
  if (!response) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your project milestones. Try refreshing the page or checking the URL."
      />
    );
  }

  const { milestones } = response;

  return (
    <div className="w-full flex flex-col gap-4">
      <MilestoneFilters projectId={projectId} />
      <div>{JSON.stringify(milestones)}</div>
    </div>
  );
};

export default ProjectIdMilestonesPage;
