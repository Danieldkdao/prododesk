import { ErrorState } from "@/components/error-state";
import { LinkButton } from "@/components/link-button";
import { OverviewSuspenseEmptyData } from "@/components/overview-suspense-empty-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardProjectCard } from "@/features/projects/components/dashboard-project-card";
import { ProjectDialog } from "@/features/projects/components/project-dialog";
import { FolderKanbanIcon, PlusIcon } from "lucide-react";
import { Suspense } from "react";
import { readDashboardProjectsAction } from "../actions/actions";

export const ProjectsSection = () => {
  return (
    <Suspense fallback={<ProjectsSectionLoading />}>
      <ProjectsSectionSuspense />
    </Suspense>
  );
};

const ProjectsSectionLoading = () => {
  return <div>loading</div>;
};

const ProjectsSectionSuspense = async () => {
  const projects = await readDashboardProjectsAction();
  if (!projects)
    return (
      <ErrorState
        title="Failed to load projects"
        description="We were unable to load your projects. Try refreshing the page or come back later."
      />
    );

  return (
    <Card className="@container border-2 pt-6 pb-0 min-w-0 gap-0 h-full max-h-175 overflow-hidden">
      <CardHeader className="px-4 flex items-center gap-2 justify-between border-b">
        <CardTitle className="text-xl">Projects</CardTitle>
        <LinkButton href="/dashboard/projects" variant="ghost">
          View all
        </LinkButton>
      </CardHeader>
      {projects.length ? (
        <CardContent className="px-0 min-w-0 grid grid-cols-1 @lg:grid-cols-2 @xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <DashboardProjectCard key={project.id} project={project} />
          ))}
        </CardContent>
      ) : (
        <OverviewSuspenseEmptyData
          icon={FolderKanbanIcon}
          title="No Projects for Today"
          description="You don't have any projects that are currently active. Create a new one to get started."
          className="border-none"
        >
          <ProjectDialog>
            <Button variant="ghost" className="w-full">
              <PlusIcon />
              New Project
            </Button>
          </ProjectDialog>
        </OverviewSuspenseEmptyData>
      )}
    </Card>
  );
};
