import { ErrorState } from "@/components/error-state";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import { readProjectsAction } from "@/features/projects/actions/actions";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectDialog } from "@/features/projects/components/project-dialog";
import { DEFAULT_PAGE } from "@/lib/constants";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";

const ProjectsPage = () => {
  return (
    <div className="w-full h-full flex flex-col gap-8">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <h1 className="text-3xl font-semibold">My Projects</h1>
        <ProjectDialog>
          <TooltipWrapper content="Create new project">
            <Button size="icon-sm">
              <PlusIcon />
            </Button>
          </TooltipWrapper>
        </ProjectDialog>
      </div>
      <Suspense fallback={<ProjectsLoading />}>
        <ProjectsSuspense />
      </Suspense>
    </div>
  );
};

const ProjectsLoading = () => {
  return <div>loading</div>;
};

const ProjectsSuspense = async () => {
  const response = await readProjectsAction({ search: "", page: DEFAULT_PAGE });
  if (!response)
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your projects. Try refreshing the page or come back later if the issue persists."
      />
    );

  const { projects } = response;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};

export default ProjectsPage;
