import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { formatColor } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  parse,
  startOfDay,
} from "date-fns";
import {
  EllipsisVerticalIcon,
  FolderKanbanIcon,
  FolderMinusIcon,
  ShapesIcon,
} from "lucide-react";
import Link from "next/link";
import { ReadProjectsActionReturnType } from "../actions/actions";
import { formatProjectStatus } from "../lib/formatters";
import { ProjectOptions } from "./project-options";

export const ProjectCard = ({
  project,
}: {
  project: ReadProjectsActionReturnType["projects"][number];
}) => {
  const { text: projectStatusText, icon: ProjectStatusIcon } =
    formatProjectStatus(project.status);

  const today = startOfDay(new Date());
  const startDate = project.startAt
    ? parse(project.startAt, "yyyy-MM-dd", today)
    : null;
  const endDate = project.endAt
    ? parse(project.endAt, "yyyy-MM-dd", today)
    : null;

  let dateRangeProgress = 0;

  if (startDate && endDate) {
    const totalDays = Math.max(differenceInCalendarDays(endDate, startDate));

    const elapsedDays = differenceInCalendarDays(today, startDate);

    dateRangeProgress = Math.round(
      Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100)),
    );
  }

  return (
    <Card
      className={cn(
        "border border-t-4 w-full h-full min-w-0 py-6 relative pb-0 gap-0",
        formatColor(project.color).borderTop,
      )}
    >
      {project.isArchived && (
        <div className="absolute z-10 inset-0 bg-muted/10 backdrop-blur-sm w-full h-full flex flex-col gap-0.5 items-center justify-center p-4">
          <h3 className="text-2xl font-semibold text-center">Archived</h3>
          <p className="text-muted-foreground text-lg text-center">
            This project has been archived since{" "}
            {project.archivedAt ? format(project.archivedAt, "PP") : "unknown"}.
          </p>
        </div>
      )}
      <CardContent className="flex flex-col gap-4 w-full min-w-0 px-5">
        <div className="flex items-start gap-4 w-full min-w-0">
          <div
            className={cn(
              "shrink-0 size-10 flex items-center justify-center",
              formatColor(project.color).bgLight,
            )}
          >
            {project.icon ? (
              <span className="text-lg">{project.icon}</span>
            ) : (
              <FolderKanbanIcon />
            )}
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <Link href={`/dashboard/projects/${project.id}`}>
              <div className="absolute inset-0" />
            </Link>
            <h2 className="text-2xl font-semibold truncate">{project.name}</h2>
            <p
              className={cn(
                "text-muted-foreground text-lg line-clamp-2",
                !project.outcome && "italic",
              )}
            >
              {project.outcome || "No outcome provided."}
            </p>
            <div className="flex items-center gap-2 mb-2 mt-4">
              <ProjectStatusIcon className="size-5" />
              <span className="text-base">{projectStatusText}</span>
            </div>
          </div>
          <ProjectOptions project={project}>
            <Button variant="ghost" size="icon-sm" className="relative z-10">
              <EllipsisVerticalIcon />
            </Button>
          </ProjectOptions>
        </div>
        <div className="flex items-center gap-2">
          {startDate && endDate ? (
            <>
              <span className="text-nowrap">{format(startDate, "PP")}</span>
              <Slider
                value={[dateRangeProgress]}
                max={100}
                disabled
                trackClassName={cn("data-horizontal:h-2")}
                indicatorClassName={cn(formatColor(project.color).bg)}
                thumbClassName={cn(formatColor(project.color).bg)}
              />
              <span className="text-nowrap">{format(endDate, "PP")}</span>
            </>
          ) : startDate ? (
            <>
              <span className="text-nowrap">
                Starts {format(startDate, "PP")}
              </span>
              <Separator className="flex-1" />
              <span className="text-nowrap text-muted-foreground">
                No end date
              </span>
            </>
          ) : (
            <>
              <Separator className="flex-1" />
              <span className="text-muted-foreground font-medium">
                No dates selected
              </span>
              <Separator className="flex-1" />
            </>
          )}
        </div>
      </CardContent>
      <Separator className="mt-(--card-spacing)" />
      <CardFooter className="flex items-center gap-2 justify-between px-5 py-4 h-full!">
        {project.area ? (
          <Link
            href={`/dashboard/areas/${project.area.id}`}
            className={cn(!project.isArchived && "relative z-10")}
          >
            <div className="flex items-center gap-2 px-4 py-2 hover:bg-muted transition-colors duration-300">
              {project.area.icon ? (
                <span className="text-base">{project.area.icon}</span>
              ) : (
                <ShapesIcon />
              )}
              <span className="text-base font-medium">{project.area.name}</span>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <FolderMinusIcon className="size-5 text-muted-foreground" />
            <span className="text-muted-foreground text-base font-medium">
              No area
            </span>
          </div>
        )}
        <span className="text-muted-foreground italic">
          Last updated{" "}
          {formatDistanceToNow(project.updatedAt, {
            addSuffix: true,
            includeSeconds: true,
          })}
        </span>
      </CardFooter>
    </Card>
  );
};
