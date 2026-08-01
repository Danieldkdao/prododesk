import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
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
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex w-full items-center gap-2">
        <Skeleton className="h-9 min-w-0 flex-1" />
        <Skeleton className="size-9 shrink-0" />
        <Skeleton className="size-9 shrink-0" />
        <div className="flex h-9 shrink-0 items-center gap-1 bg-muted p-1">
          <Skeleton className="h-7 w-14 bg-background/70" />
          <Skeleton className="h-7 w-16 bg-background/70" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex min-w-0 items-start gap-2 border-b py-3"
          >
            <Skeleton className="mt-0.5 size-5 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <Skeleton className="h-5 w-52 max-w-full" />
                <Skeleton className="h-5 w-14 shrink-0" />
              </div>
              <Skeleton className="h-4 w-3/4 max-w-full" />
              <Skeleton className="h-3.5 w-32 max-w-full" />
            </div>
            <Skeleton className="size-7 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
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
