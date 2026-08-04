import { ErrorState } from "@/components/error-state";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import { readProjectsAction } from "@/features/projects/actions/actions";
import { ProjectDialog } from "@/features/projects/components/project-dialog";
import { ProjectsFilters } from "@/features/projects/components/projects-filters";
import { ProjectsInfiniteList } from "@/features/projects/components/projects-infinite-list";
import { ProjectsSkeleton } from "@/features/projects/components/projects-skeleton";
import { loadProjectsSearchParams } from "@/features/projects/lib/projects-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { SearchParamsType } from "@/lib/types";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";

const ProjectsPage = (props: SearchParamsType) => {
  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <h1 className="text-3xl font-semibold">My Projects</h1>
        <ProjectDialog>
          <Button>
            <PlusIcon />
            Create
          </Button>
        </ProjectDialog>
      </div>
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsSuspense {...props} />
      </Suspense>
    </div>
  );
};

const ProjectsSuspense = async ({ searchParams }: SearchParamsType) => {
  const filters = await loadProjectsSearchParams(searchParams);
  const response = await readProjectsAction({ ...filters, page: DEFAULT_PAGE });
  if (!response)
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your projects. Try refreshing the page or come back later if the issue persists."
      />
    );

  const { projects, metadata } = response;

  return (
    <div className="w-full flex flex-col gap-8">
      <ProjectsFilters />
      <ProjectsInfiniteList
        initialProjects={projects}
        initialHasNextPage={metadata.hasNextPage}
      />
    </div>
  );
};

export default ProjectsPage;
