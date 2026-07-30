import { ErrorState } from "@/components/error-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTasksAction } from "@/features/tasks/actions/actions";
import { ProjectTaskBoard } from "@/features/tasks/components/project-task-board";
import { ProjectTasksInfiniteList } from "@/features/tasks/components/project-tasks-infinite-list";
import { TasksFilters } from "@/features/tasks/components/tasks-filters";
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
    <Tabs defaultValue="board">
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-2 w-full">
          <TasksFilters defaultProject={currentProject} />
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="list">
          <ProjectTasksInfiniteList
            key={tasksClientKey}
            project={currentProject}
            initialTasks={tasks}
            initialHasNextPage={metadata.hasNextPage}
            allTasksCompleted={metadata.allTasksCompleted}
          />
        </TabsContent>
        <TabsContent value="board">
          <ProjectTaskBoard
            key={currentProject.id}
            project={currentProject}
            initialTasks={tasks}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default ProjectIdTasksPage;
