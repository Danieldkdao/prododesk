import { ErrorState } from "@/components/error-state";
import { ProjectTasksView } from "@/features/projects/components/project-tasks-view";
import { readTasksAction } from "@/features/tasks/actions/actions";
import { AreaProjectTasksSkeleton } from "@/features/tasks/components/area-project-tasks-skeleton";
import { loadTasksSearchParams } from "@/features/tasks/lib/tasks-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";

type ProjectIdParams = ParamsId<"projectId"> & SearchParamsType;

const ProjectIdTasksPage = (props: ProjectIdParams) => {
  return (
    <Suspense fallback={<AreaProjectTasksSkeleton />}>
      <ProjectIdTasksSuspense {...props} />
    </Suspense>
  );
};

const ProjectIdTasksSuspense = async ({
  params,
  searchParams,
}: ProjectIdParams) => {
  const { projectId } = await params;
  const taskFilters = await loadTasksSearchParams(searchParams);

  const [listResponse, boardResponse] = await Promise.all([
    readTasksAction({
      page: DEFAULT_PAGE,
      projectIds: [projectId],
      ...taskFilters,
    }),
    readTasksAction({
      page: DEFAULT_PAGE,
      allTasks: true,
      projectIds: [projectId],
      ...taskFilters,
    }),
  ]);
  if (!listResponse || !boardResponse) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your tasks. Try refreshing the page or adding some tasks."
      />
    );
  }

  return (
    <ProjectTasksView
      projectId={projectId}
      listResponse={listResponse}
      boardResponse={boardResponse}
    />
  );
};

export default ProjectIdTasksPage;
