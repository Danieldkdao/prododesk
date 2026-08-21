import { ErrorState } from "@/components/error-state";
import { InfoCard } from "@/components/info-card";
import { confirmUserAreaOwnership } from "@/features/areas/server/areas";
import { AreaProjectTasksSkeleton } from "@/features/tasks/components/area-project-tasks-skeleton";
import { TasksView } from "@/features/tasks/components/tasks-view";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
import { Suspense } from "react";

type AreaIdTasksParams = ParamsId<"areaId"> & SearchParamsType;

const AreaIdTasksPage = (props: AreaIdTasksParams) => {
  return (
    <Suspense fallback={<AreaProjectTasksSkeleton showProject />}>
      <AreaIdTasksSuspense {...props} />
    </Suspense>
  );
};

const AreaIdTasksSuspense = async (props: AreaIdTasksParams) => {
  const { areaId } = await props.params;

  if (!areValidIds(areaId))
    return (
      <InfoCard
        title="Area not found"
        description="We were unable to find the area you are looking for. Please check the URL and try again."
      />
    );

  const existingArea = await confirmUserAreaOwnership(areaId);
  if (!existingArea)
    return (
      <ErrorState
        title="Area not found"
        description="We were unable to find the area you are looking for. Please check the URL and try again."
      />
    );

  return <TasksView showFilterAddButton {...props} />;
};

export default AreaIdTasksPage;
