import { ErrorState } from "@/components/error-state";
import { readProjectsAction } from "@/features/projects/actions/actions";
import { ProjectFilters } from "@/features/projects/components/project-filters";
import { ProjectsInfiniteList } from "@/features/projects/components/projects-infinite-list";
import { ProjectsSkeleton } from "@/features/projects/components/projects-skeleton";
import { loadProjectsSearchParams } from "@/features/projects/lib/projects-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";

type AreaIdProjectsParams = ParamsId<"areaId"> & SearchParamsType;

const AreaIdProjectsPage = (props: AreaIdProjectsParams) => {
  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <AreaIdProjectsSuspense {...props} />
    </Suspense>
  );
};

const AreaIdProjectsSuspense = async ({
  params,
  searchParams,
}: AreaIdProjectsParams) => {
  const { areaId } = await params;
  const filters = await loadProjectsSearchParams(searchParams);

  const response = await readProjectsAction({
    ...filters,
    areaIds: [areaId],
    page: DEFAULT_PAGE,
  });
  if (!response) {
    return (
      <ErrorState
        title="Failed to load projects"
        description="We were unable to load your projects in this area. Try refreshing the page or checking the URL."
      />
    );
  }

  const { projects, metadata } = response;

  const currentArea = metadata.areas.at(0);
  if (!currentArea) return null;

  return (
    <div className="flex flex-col gap-4">
      <ProjectFilters area={currentArea} />
      <ProjectsInfiniteList
        key={metadata.clientKey}
        areaId={areaId}
        initialProjects={projects}
        initialHasNextPage={metadata.hasNextPage}
      />
    </div>
  );
};

export default AreaIdProjectsPage;
