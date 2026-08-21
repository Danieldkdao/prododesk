import { NotFound } from "@/components/not-found";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatColor } from "@/lib/formatters";
import { ParamsId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, parse } from "date-fns";
import { EllipsisIcon, FolderKanbanIcon, ShapesIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { readProjectAction } from "../actions/actions";
import { formatProjectStatus } from "../lib/formatters";
import { ProjectIdHeaderTabs } from "./project-id-header-tabs";
import { ProjectOptions } from "./project-options";

type ProjectIdParams = ParamsId<"projectId">;

export const ProjectIdHeader = (props: ProjectIdParams) => {
  return (
    <Suspense fallback={<ProjectIdHeaderLoading />}>
      <ProjectIdHeaderSuspense {...props} />
    </Suspense>
  );
};
const ProjectIdHeaderLoading = () => {
  return (
    <Card className="w-full min-w-0 border border-t-4 border-t-muted pb-0 shadow-lg">
      <CardContent className="w-full min-w-0">
        <div className="flex flex-col items-start gap-8 md:flex-row">
          <div className="flex w-full min-w-0 items-start justify-between gap-2 md:w-fit">
            <Skeleton className="size-18 shrink-0" />
            <Skeleton className="size-11 shrink-0 md:hidden" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex min-w-0 flex-wrap items-center gap-4">
              <Skeleton className="h-10 w-72 max-w-full" />
              <Skeleton className="h-9 w-28 shrink-0" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-full max-w-4xl" />
              <Skeleton className="h-6 w-2/3 max-w-2xl" />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-52 max-w-full" />
              <Skeleton className="h-6 w-40 max-w-full" />
            </div>
          </div>
          <Skeleton className="hidden size-11 shrink-0 md:block" />
        </div>
      </CardContent>
      <CardFooter className="w-full min-w-0">
        <div className="w-full min-w-0">
          <div className="hidden items-center gap-6 overflow-hidden md:flex">
            <Skeleton className="h-8 w-20 shrink-0" />
            <Skeleton className="h-8 w-24 shrink-0" />
            <Skeleton className="h-8 w-28 shrink-0" />
            <Skeleton className="h-8 w-28 shrink-0" />
            <Skeleton className="h-8 w-20 shrink-0" />
          </div>
          <Skeleton className="h-10 w-full md:hidden" />
        </div>
      </CardFooter>
    </Card>
  );
};

const ProjectIdHeaderSuspense = async ({ params }: ProjectIdParams) => {
  const { projectId } = await params;
  const project = await readProjectAction(projectId);
  if (!project) {
    return (
      <NotFound
        title="Project not found"
        description="We were unable to find this project. Try refreshing the page or checking the URL."
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
        "border border-t-4 shadow-sm w-full min-w-0 pb-0",
        borderTop,
      )}
    >
      <CardContent className="w-full min-w-0">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="flex items-start justify-between gap-2 w-full min-w-0 md:w-fit">
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
            <div className="shrink-0 md:hidden">
              <ProjectOptions project={project}>
                <Button variant="ghost" size="icon-lg">
                  <EllipsisIcon className="size-8" />
                </Button>
              </ProjectOptions>
            </div>
          </div>
          <div className="flex flex-col gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-4">
              <h1 className="text-[2.5rem] leading-none font-semibold">
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
            <div className="flex items-center gap-6 flex-wrap">
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
                    ? `${format(parse(project.startAt, "yyyy-MM-dd", new Date()), "PP")} - ${format(parse(project.endAt, "yyyy-MM-dd", new Date()), "PP")}`
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
          <div className="shrink-0 hidden md:inline">
            <ProjectOptions project={project}>
              <Button variant="ghost" size="icon-lg">
                <EllipsisIcon className="size-8" />
              </Button>
            </ProjectOptions>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <ProjectIdHeaderTabs project={project} />
      </CardFooter>
    </Card>
  );
};
