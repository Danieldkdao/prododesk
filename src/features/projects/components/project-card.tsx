import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { formatColor } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, parse, startOfDay } from "date-fns";
import {
  ArchiveIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CircleDashedIcon,
  ClockIcon,
  DotIcon,
  EllipsisIcon,
  FolderKanbanIcon,
  PlusIcon,
  ShapesIcon,
} from "lucide-react";
import Link from "next/link";
import { Fragment } from "react/jsx-runtime";
import { ReadProjectsActionReturnType } from "../actions/actions";
import { formatProjectStatus } from "../lib/formatters";
import { ProjectDialog } from "./project-dialog";
import { ProjectOptions } from "./project-options";
import { TaskDetailsTrigger } from "@/features/tasks/components/task-details-trigger";

export const ProjectCard = ({
  project,
}: {
  project: ReadProjectsActionReturnType["projects"][number];
}) => {
  const { text: projectStatusText, icon: ProjectStatusIcon } =
    formatProjectStatus(project.status);
  const { borderLeft, bgLight, text, bg } = formatColor(project.color);

  const today = startOfDay(new Date());
  const startDate = project.startAt
    ? parse(project.startAt, "yyyy-MM-dd", today)
    : null;
  const endDate = project.endAt
    ? parse(project.endAt, "yyyy-MM-dd", today)
    : null;

  const projectProgress = Math.round(
    (project.completeTaskCount / project.taskCount) * 100,
  );

  const stats = [
    {
      icon: project.isArchived ? ArchiveIcon : ProjectStatusIcon,
      label: project.isArchived ? "Archived" : projectStatusText,
    },
    {
      icon: ShapesIcon,
      label: project.area?.name || "No area",
      href: project.area?.id ? `/dashboard/areas/${project.area.id}` : null,
    },
    {
      icon: CalendarDaysIcon,
      label: startDate
        ? `${format(startDate, "PP")} — ${endDate ? format(endDate, "PP") : "No end date"}`
        : "No dates",
    },
    {
      icon: ClockIcon,
      label: formatDistanceToNow(project.updatedAt, {
        includeSeconds: true,
        addSuffix: true,
      }),
    },
  ];

  return (
    <Card
      className={cn(
        "border border-l-4 w-full h-full min-w-0 relative py-4",
        borderLeft,
      )}
    >
      <CardContent className="px-4 min-w-0 flex flex-col gap-4 h-full">
        <div className="flex w-full min-w-0">
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-10 flex items-center justify-center shrink-0",
                  bgLight,
                )}
              >
                {project.icon ? (
                  <span className="text-2xl">{project.icon}</span>
                ) : (
                  <FolderKanbanIcon className={text} />
                )}
              </div>
              <span className="text-2xl font-semibold">{project.name}</span>
              <Link href={`/dashboard/projects/${project.id}`}>
                <span className="absolute inset-0" />
              </Link>
            </div>
            {project.outcome ? (
              <p className="text-muted-foreground text-lg line-clamp-2">
                {project.outcome}
              </p>
            ) : (
              <ProjectDialog
                nativeButton={false}
                existingProject={project}
                defaultValues={{ area: project.area }}
              >
                <div
                  className={cn(
                    "flex items-start gap-2 leading-7 relative z-10",
                    text,
                  )}
                >
                  <span className="h-[1lh] flex items-center">
                    <PlusIcon />
                  </span>
                  <span className="text-lg">
                    Add an outcome so this project has a clear finish line
                  </span>
                </div>
              </ProjectDialog>
            )}
          </div>
          <ProjectOptions project={project}>
            <Button variant="ghost" size="icon-sm" className="relative z-10">
              <EllipsisIcon />
            </Button>
          </ProjectOptions>
        </div>
        <div className="flex items-start gap-2 leading-6 p-2 bg-muted">
          {project.nextTask ? (
            <TaskDetailsTrigger
              taskId={project.nextTask.id}
              className="relative z-10 flex items-start gap-2"
            >
              <span className="h-[1lh] flex items-center">
                <ArrowRightIcon className="size-5 text-muted-foreground shrink-0" />
              </span>
              <span className="text-base text-foreground font-medium">
                Next:{" "}
                <span className="text-muted-foreground font-normal">
                  {project.isArchived
                    ? "Restore to continue"
                    : project.nextTask.name}
                </span>
              </span>
            </TaskDetailsTrigger>
          ) : (
            <>
              <span className="h-[1lh] flex items-center">
                <PlusIcon className="size-5 text-muted-foreground shrink-0" />
              </span>
              <span className="text-base text-foreground font-medium">
                Set next action:{" "}
                <span className="text-muted-foreground font-normal">
                  Choose the smallest useful step
                </span>
              </span>
            </>
          )}
        </div>
        {project.taskCount ? (
          <div className="flex flex-col gap-1">
            <div className="w-full flex items-center gap-2 justify-between">
              <span className="text-muted-foreground text-base">
                {project.completeTaskCount} / {project.taskCount} tasks
              </span>
              <span className="text-muted-foreground text-base font-medium">
                {projectProgress}%
              </span>
            </div>
            <Progress
              value={projectProgress}
              className="w-full"
              indicatorClassName={bg}
              trackClassName="h-2"
            />
          </div>
        ) : (
          <TaskDialog nativeButton={false} defaultValues={{ project }}>
            <div className="flex items-start gap-2 leading-6 p-2 bg-muted cursor-pointer relative z-10">
              <span className="h-[1lh] flex items-center">
                <CircleDashedIcon className="size-5 text-muted-foreground shrink-0" />
              </span>
              <span className="text-base text-muted-foreground">
                Progress starts when tasks added
              </span>
            </div>
          </TaskDialog>
        )}
        <div className="flex items-center gap-1 flex-wrap mt-2">
          {stats.map((stat, index) => {
            const children = (
              <div className="flex items-center gap-2 text-muted-foreground">
                <stat.icon className="size-5" />
                <span className="text-base">{stat.label}</span>
              </div>
            );

            if (stat.href) {
              return (
                <Fragment key={index}>
                  <Link key={index} href={stat.href} className="relative z-10">
                    {children}
                  </Link>
                  <DotIcon className="text-muted-foreground/30 size-5 last:hidden" />
                </Fragment>
              );
            }
            return (
              <Fragment key={index}>
                {children}
                <DotIcon className="text-muted-foreground/30 size-5 last:hidden" />
              </Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
