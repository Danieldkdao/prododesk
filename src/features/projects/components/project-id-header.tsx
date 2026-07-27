import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatColor } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { EllipsisIcon, FolderKanbanIcon, ShapesIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { readProjectAction } from "../actions/actions";
import { formatProjectStatus } from "../lib/formatters";
import { ProjectIdHeaderTabs } from "./project-id-header-tabs";
import { ProjectOptions } from "./project-options";
import { ParamsId } from "@/lib/types";

type ProjectIdParams = ParamsId<"projectId">;

export const ProjectIdHeader = (props: ProjectIdParams) => {
  return (
    <Suspense fallback={<ProjectIdHeaderLoading />}>
      <ProjectIdHeaderSuspense {...props} />
    </Suspense>
  );
};

const ProjectIdHeaderLoading = () => {
  return <div>loading</div>;
};

const ProjectIdHeaderSuspense = async ({ params }: ProjectIdParams) => {
  const { projectId } = await params;
  const project = await readProjectAction(projectId);
  if (!project) {
    return (
      <ErrorState
        title="Something went wrong"
        description="We were unable to load this project. Try refreshing the page or checking the URL."
      />
    );
  }

  const { borderTop, bgLight, text } = formatColor(project.color);
  const {
    text: projectStatusText,
    icon: ProjectStatusIcon,
    bgColor: projectStatusBgColor,
    borderColor: projectStatusBorderColor,
    textColor: projectStatusTextColor,
  } = formatProjectStatus(project.status);

  return (
    <Card
      className={cn(
        "border border-t-4 shadow-lg w-full min-w-0 pb-0",
        borderTop,
      )}
    >
      <CardContent className="w-full min-w-0">
        <div className="flex gap-8">
          <div
            className={cn(
              "size-18 flex items-center justify-center shrink-0",
              bgLight,
            )}
          >
            {project.icon ? (
              <span className="text-5xl">{project.icon}</span>
            ) : (
              <FolderKanbanIcon className={cn("size-14", text)} />
            )}
          </div>
          <div className="flex flex-col gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-4">
              <h1 className="text-[2.5rem] leading-0 font-semibold">
                {project.name}
              </h1>
              <div
                className={cn(
                  "flex items-center gap-2 border-2 py-1 px-2",
                  projectStatusBorderColor,
                  projectStatusBgColor,
                  projectStatusTextColor,
                )}
              >
                <ProjectStatusIcon className="size-5" />
                <span className="text-base font-medium">
                  {projectStatusText}
                </span>
              </div>
            </div>
            <p className="text-xl text-muted-foreground max-w-6xl">
              {project.outcome}
            </p>
            <div className="flex items-center gap-6">
              {project.area && (
                <Link href={`/dashboard/areas/${project.area.id}`}>
                  <div className="flex items-center gap-2">
                    {project.area.icon ? (
                      <span className="text-lg">{project.area.icon}</span>
                    ) : (
                      <ShapesIcon />
                    )}
                    <span className="text-lg font-medium text-muted-foreground">
                      {project.area.name}
                    </span>
                  </div>
                </Link>
              )}
              <span className="text-lg font-medium text-muted-foreground">
                {project.startAt
                  ? project.endAt
                    ? `${format(project.startAt, "PP")} - ${format(project.endAt, "PP")}`
                    : `${format(project.startAt, "PP")} - Unknown`
                  : "No dates selected"}
              </span>
              <span className="text-lg font-medium text-muted-foreground">
                Updated{" "}
                {formatDistanceToNow(project.updatedAt, {
                  includeSeconds: true,
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
          <ProjectOptions project={project}>
            <Button variant="ghost" size="icon-lg" className="shrink-0">
              <EllipsisIcon className="size-8" />
            </Button>
          </ProjectOptions>
        </div>
      </CardContent>
      <CardFooter>
        <ProjectIdHeaderTabs project={project} />
      </CardFooter>
    </Card>
  );
};
