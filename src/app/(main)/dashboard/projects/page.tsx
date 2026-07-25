import { ErrorState } from "@/components/error-state";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import { readProjectsAction } from "@/features/projects/actions/actions";
import { ProjectDialog } from "@/features/projects/components/project-dialog";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";

const ProjectsPage = () => {
  return (
    <div className="flex flex-col gap-4 p-10 max-w-384 mx-auto">
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
  const projects = await readProjectsAction();
  if (!projects)
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your projects. Try refreshing the page or come back later if the issue persists."
      />
    );

  return <div>{JSON.stringify(projects)}</div>;
};

export default ProjectsPage;
