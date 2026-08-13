import { NotFound } from "@/components/not-found";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ProjectStatus, TaskStatus } from "@/db/shared";
import { formatColor } from "@/lib/formatters";
import { ParamsId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  ClockIcon,
  EllipsisIcon,
  FolderKanbanIcon,
  ListCheckIcon,
  ShapesIcon,
} from "lucide-react";
import { Suspense } from "react";
import { readAreaAction } from "../actions/actions";
import { AreaIdHeaderSkeleton } from "./area-id-header-skeletons";
import { AreaIdHeaderTabs } from "./area-id-header-tabs";
import { AreaOptions } from "./area-options";

type AreaIdParams = ParamsId<"areaId">;

export const AreaIdHeader = (props: AreaIdParams) => {
  return (
    <Suspense fallback={<AreaIdHeaderSkeleton />}>
      <AreaIdSuspense {...props} />
    </Suspense>
  );
};

const AreaIdSuspense = async ({ params }: AreaIdParams) => {
  const { areaId } = await params;
  const area = await readAreaAction(areaId);
  if (!area) {
    return (
      <NotFound
        title="Area not found"
        description="We were unable to find this area. Try refreshing the page or checking the URL."
      />
    );
  }

  const { borderTop, bgLight, text } = formatColor(area.color);

  const projectStatusCounts = Object.fromEntries(
    area.projectCounts.map(({ status, count }) => [status, count]),
  ) as Record<ProjectStatus, number>;
  const activeProjectCount = projectStatusCounts.active ?? 0;

  const taskStatusCounts = Object.fromEntries(
    area.taskCounts.map(({ status, count }) => [status, count]),
  ) as Record<TaskStatus, number>;
  const completedTaskCount = taskStatusCounts?.completed ?? 0;
  const totalTaskCount = area.taskCounts.reduce((a, b) => a + b.count, 0);
  const openTaskCount = totalTaskCount - completedTaskCount;

  return (
    <Card
      className={cn(
        "border border-t-4 shadow-lg w-full min-w-0 pb-0",
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
              {area.icon ? (
                <span className="text-5xl">{area.icon}</span>
              ) : (
                <ShapesIcon className={cn("size-14", text)} />
              )}
            </div>
            <div className="shrink-0 md:hidden">
              <AreaOptions area={area}>
                <Button variant="ghost" size="icon-lg">
                  <EllipsisIcon className="size-8" />
                </Button>
              </AreaOptions>
            </div>
          </div>
          <div className="flex flex-col gap-4 flex-1 min-w-0">
            <h1 className="text-[2.5rem] leading-none font-semibold">
              {area.name}
            </h1>
            <p className="text-xl text-muted-foreground max-w-6xl">
              {area.description}
            </p>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <FolderKanbanIcon className="text-muted-foreground size-5" />
                <span className="text-lg font-medium text-muted-foreground">
                  {activeProjectCount} active{" "}
                  {activeProjectCount === 1 ? "project" : "projects"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ListCheckIcon className="text-muted-foreground size-5" />
                <span className="text-lg font-medium text-muted-foreground">
                  {openTaskCount} open {openTaskCount === 1 ? "task" : "tasks"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="text-muted-foreground size-5" />
                <span className="text-lg font-medium text-muted-foreground">
                  Updated{" "}
                  {formatDistanceToNow(area.updatedAt, {
                    includeSeconds: true,
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0 hidden md:inline">
            <AreaOptions area={area}>
              <Button variant="ghost" size="icon-lg" className="shrink-0">
                <EllipsisIcon className="size-8" />
              </Button>
            </AreaOptions>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <AreaIdHeaderTabs area={area} />
      </CardFooter>
    </Card>
  );
};
