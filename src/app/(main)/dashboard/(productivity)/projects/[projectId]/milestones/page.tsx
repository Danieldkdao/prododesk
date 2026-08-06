import { ErrorState } from "@/components/error-state";
import { readProjectMilestonesAction } from "@/features/milestones/actions/actions";
import { MilestoneCard } from "@/features/milestones/components/milestone-card";
import { MilestoneFilters } from "@/features/milestones/components/milestone-filters";
import { ParamsId } from "@/lib/types";
import { Fragment, Suspense } from "react";

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
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr]">
        <div>task list goes here</div>
        <div className="flex flex-col gap-4 w-full min-w-0">
          {milestones.map((milestone) => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectIdMilestonesPage;
