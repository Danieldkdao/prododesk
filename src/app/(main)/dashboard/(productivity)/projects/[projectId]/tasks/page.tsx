import { ErrorState } from "@/components/error-state";
import { InfoCard } from "@/components/info-card";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
import { AreaProjectTasksSkeleton } from "@/features/tasks/components/area-project-tasks-skeleton";
import { TasksView } from "@/features/tasks/components/tasks-view";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
import { Suspense } from "react";

type ProjectIdParams = ParamsId<"projectId"> & SearchParamsType;

const ProjectIdTasksPage = (props: ProjectIdParams) => {
  return (
    <Suspense fallback={<AreaProjectTasksSkeleton />}>
      <ProjectIdTasksSuspense {...props} />
    </Suspense>
  );
};

const ProjectIdTasksSuspense = async (props: ProjectIdParams) => {
  const { projectId } = await props.params;

  if (!areValidIds(projectId))
    return (
      <InfoCard
        title="Project not found"
        description="We were unable to find the project you are looking for. Please check the URL and try again."
      />
    );

  const existingProject = await confirmUserProjectOwnership(projectId);
  if (!existingProject)
    return (
      <ErrorState
        title="Project not found"
        description="We were unable to find the project you are looking for. Please check the URL and try again."
      />
    );

  return <TasksView showFilterAddButton {...props} />;
};

export default ProjectIdTasksPage;
