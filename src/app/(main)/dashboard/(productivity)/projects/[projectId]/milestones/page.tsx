import { ErrorState } from "@/components/error-state";
import { readProjectMilestonesAction } from "@/features/milestones/actions/actions";
import { MilestoneCard } from "@/features/milestones/components/milestone-card";
import { MilestonesFilters } from "@/features/milestones/components/milestones-filters";
import { MilestonesInfiniteList } from "@/features/milestones/components/milestones-infinite-list";
import { loadMilestonesSearchParams } from "@/features/milestones/lib/milestones-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";

type ProjectIdMilestonesProps = ParamsId<"projectId"> & SearchParamsType;

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
  searchParams,
}: ProjectIdMilestonesProps) => {
  const { projectId } = await params;
  const filters = await loadMilestonesSearchParams(searchParams);

  const response = await readProjectMilestonesAction(projectId, {
    ...filters,
    page: DEFAULT_PAGE,
  });
  if (!response) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your project milestones. Try refreshing the page or checking the URL."
      />
    );
  }

  const { milestones, metadata } = response;

  return (
    <div className="w-full flex flex-col gap-4">
      <MilestonesFilters projectId={projectId} />
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr]">
        <div>task list goes here</div>
        <MilestonesInfiniteList
          key={metadata.clientKey}
          projectId={projectId}
          initialMilestones={milestones}
          initialHasNextPage={metadata.hasNextPage}
        />
      </div>
    </div>
  );
};

export default ProjectIdMilestonesPage;
