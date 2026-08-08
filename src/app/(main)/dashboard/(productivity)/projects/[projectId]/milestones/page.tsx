import { ErrorState } from "@/components/error-state";
import { readProjectMilestonesAction } from "@/features/milestones/actions/actions";
import { MilestonesSkeleton } from "@/features/milestones/components/milestones-skeleton";
import { MilestonesView } from "@/features/milestones/components/milestones-view";
import { loadMilestonesSearchParams } from "@/features/milestones/lib/milestones-params";
import { readTasksAction } from "@/features/tasks/actions/actions";
import {
  defaultDayTasksParamsOptions,
  loadTasksSearchParams,
} from "@/features/tasks/lib/tasks-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";

type ProjectIdMilestonesProps = ParamsId<"projectId"> & SearchParamsType;

const ProjectIdMilestonesPage = (props: ProjectIdMilestonesProps) => {
  return (
    <Suspense fallback={<MilestonesSkeleton />}>
      <ProjectIdMilestonesSuspense {...props} />
    </Suspense>
  );
};

const ProjectIdMilestonesSuspense = async ({
  params,
  searchParams,
}: ProjectIdMilestonesProps) => {
  const { projectId } = await params;
  const filters = await loadMilestonesSearchParams(searchParams);
  const { search } = await loadTasksSearchParams(searchParams);

  const milestonesResponse = await readProjectMilestonesAction(projectId, {
    ...filters,
    page: DEFAULT_PAGE,
  });
  const tasksResponse = await readTasksAction(null, [projectId], {
    ...defaultDayTasksParamsOptions,
    search,
    page: DEFAULT_PAGE,
    unassignedOnly: true,
  });
  if (!milestonesResponse || !tasksResponse) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your project milestones. Try refreshing the page or checking the URL."
      />
    );
  }

  return (
    <MilestonesView
      projectId={projectId}
      milestonesResponse={milestonesResponse}
      tasksResponse={tasksResponse}
    />
  );
};

export default ProjectIdMilestonesPage;
