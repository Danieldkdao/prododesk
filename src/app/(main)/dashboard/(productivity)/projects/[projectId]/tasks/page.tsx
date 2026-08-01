import { ErrorState } from "@/components/error-state";
import { ProjectTasksView } from "@/features/projects/components/project-tasks-view";
import { getTasksAction } from "@/features/tasks/actions/actions";
import { loadTasksSearchParams } from "@/features/tasks/lib/tasks-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";

type ProjectIdParams = ParamsId<"projectId"> & SearchParamsType;

const ProjectIdTasksPage = (props: ProjectIdParams) => {
  return (
    <Suspense fallback={<ProjectIdTasksLoading />}>
      <ProjectIdTasksSuspense {...props} />
    </Suspense>
  );
};

const ProjectIdTasksLoading = () => {
  return <div>loading</div>;
};

const ProjectIdTasksSuspense = async ({
  params,
  searchParams,
}: ProjectIdParams) => {
  const { projectId } = await params;
  const taskFilters = await loadTasksSearchParams(searchParams);

  const response = await getTasksAction(null, [projectId], {
    page: DEFAULT_PAGE,
    ...taskFilters,
  });
  if (!response) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your tasks. Try refreshing the page or adding some tasks."
      />
    );
  }

  return <ProjectTasksView projectId={projectId} response={response} />;
};

export default ProjectIdTasksPage;
