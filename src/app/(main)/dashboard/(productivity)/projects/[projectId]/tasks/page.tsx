import { ErrorState } from "@/components/error-state";
import { getTasksAction } from "@/features/tasks/actions/actions";
import { ProjectTasksInfiniteList } from "@/features/tasks/components/project-tasks-infinite-list";
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

  const { tasks, metadata } = response;

  const currentProject = metadata.projects?.find(
    (project) => project.id === projectId,
  );
  if (!currentProject) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your project. Try refreshing the page or come back later if the issue persists."
      />
    );
  }

  const tasksClientKey =
    `${tasks.map(
      (task) => `
    ${task.name}
    ${task.createdAt.toISOString()}
    ${task.description}
    ${task.dueAt ? task.dueAt.toISOString() : "no due date"}
    ${task.emoji || "no emoji"}${task.id}${task.priority}
    ${task.projectId || "no project"}
    ${task.scheduledAt ? task.scheduledAt.toISOString() : "no scheduled date"}
    ${task.status}${task.updatedAt.toISOString()}
    ${task.userId}`,
    )}
  ` +
    `${metadata.hasNextPage ? "has next page" : "no next page"}${metadata.allTasksCompleted ? "all tasks complete" : "some tasks remain"}`;

  return (
    <ProjectTasksInfiniteList
      key={tasksClientKey}
      project={currentProject}
      initialTasks={tasks}
      initialHasNextPage={metadata.hasNextPage}
      allTasksCompleted={metadata.allTasksCompleted}
    />
  );
};

export default ProjectIdTasksPage;
