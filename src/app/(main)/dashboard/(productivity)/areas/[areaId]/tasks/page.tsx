import { ErrorState } from "@/components/error-state";
import { readTasksAction } from "@/features/tasks/actions/actions";
import { AreaProjectTasksSkeleton } from "@/features/tasks/components/area-project-tasks-skeleton";
import { AreaTasksInfiniteList } from "@/features/tasks/components/area-tasks-infinite-list";
import { TasksFilters } from "@/features/tasks/components/tasks-filters";
import { loadTasksSearchParams } from "@/features/tasks/lib/tasks-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";

type AreaIdTasksParams = ParamsId<"areaId"> & SearchParamsType;

const AreaIdTasksPage = (props: AreaIdTasksParams) => {
  return (
    <Suspense fallback={<AreaProjectTasksSkeleton showProject />}>
      <AreaIdTasksSuspense {...props} />
    </Suspense>
  );
};

const AreaIdTasksSuspense = async ({
  params,
  searchParams,
}: AreaIdTasksParams) => {
  const { areaId } = await params;
  const filters = await loadTasksSearchParams(searchParams);

  const response = await readTasksAction({
    ...filters,
    areaIds: [areaId],
    page: DEFAULT_PAGE,
  });
  if (!response) {
    return (
      <ErrorState
        title="An error ocurred"
        description="We were unable to load your tasks for this area. Try refreshing the page or checking the URL."
      />
    );
  }

  const { tasks, metadata } = response;

  return (
    <div className="w-full flex flex-col gap-4">
      <TasksFilters />
      <AreaTasksInfiniteList
        key={metadata.clientKey}
        areaId={areaId}
        initialTasks={tasks}
        initialHasNextPage={metadata.hasNextPage}
      />
    </div>
  );
};

export default AreaIdTasksPage;
