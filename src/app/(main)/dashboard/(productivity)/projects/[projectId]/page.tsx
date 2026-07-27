import { ErrorState } from "@/components/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { readProjectAction } from "@/features/projects/actions/actions";
import { formatProjectStatus } from "@/features/projects/lib/formatters";
import { formatColor } from "@/lib/formatters";
import { ParamsId } from "@/lib/types";
import { differenceInCalendarDays, format, parse } from "date-fns";
import { ShapesIcon } from "lucide-react";
import { Fragment, Suspense } from "react";

type ProjectIdParams = ParamsId<"projectId">;

const ProjectIdPage = (props: ProjectIdParams) => {
  return (
    <Suspense fallback={<ProjectIdLoading />}>
      <ProjectIdSuspense {...props} />
    </Suspense>
  );
};

const ProjectIdLoading = () => {
  return <div>loading</div>;
};

const ProjectIdSuspense = async ({ params }: ProjectIdParams) => {
  const { projectId } = await params;

  const project = await readProjectAction(projectId);
  if (!project) {
    return (
      <ErrorState
        title="Something went wrong"
        description="We were unable to load your project. Try refreshing the page or check the URL."
      />
    );
  }
  const area = project.area;
  const tasks = project.tasks;

  const completedTasks = tasks.filter((task) => task.isCompleted);
  const progressValue = Math.round(
    (completedTasks.length / (tasks.length || 1)) * 100,
  );

  const startAt = project.startAt
    ? parse(project.startAt, "yyyy-MM-dd", new Date())
    : null;
  const endAt = project.endAt
    ? parse(project.endAt, "yyyy-MM-dd", new Date())
    : null;

  const daysLeft =
    startAt && endAt ? differenceInCalendarDays(endAt, startAt) : 0;

  const { label: colorLabel } = formatColor(project.color);
  const { text: projectStatusText, icon: ProjectStatusIcon } =
    formatProjectStatus(project.status);

  const details = [
    {
      label: "Status",
      children: (
        <div className="flex items-center gap-2">
          <ProjectStatusIcon className="size-5" />
          <span className="text-lg font-medium">{projectStatusText}</span>
        </div>
      ),
    },
    {
      label: "Area",
      children: area?.icon ? (
        <div className="flex items-center gap-2">
          {area.icon ? (
            <span className="text-lg">{area.icon}</span>
          ) : (
            <ShapesIcon className="size-5" />
          )}
          <span className="text-lg font-medium">{area.name}</span>
        </div>
      ) : (
        <span className="text-lg font-medium">No area</span>
      ),
    },
    {
      label: "Start date",
      children: (
        <span className="text-lg font-medium">
          {startAt ? format(startAt, "PP") : "None"}
        </span>
      ),
    },
    {
      label: "End date",
      children: (
        <span className="text-lg font-medium">
          {endAt ? format(endAt, "PP") : "None"}
        </span>
      ),
    },
    {
      label: "Owner",
      children: (
        <span className="text-lg font-medium">{project.user.name}</span>
      ),
    },
    {
      label: "Color",
      children: <span className="text-lg font-medium">{colorLabel}</span>,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-8">
      <div className="flex flex-col w-full min-w-0 gap-8">
        <Card className="border gap-0 pb-0">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl font-semibold">
              Project tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="py-4 bg-muted px-(--card-spacing)">
              <span className="text-lg font-bold uppercase text-muted-foreground">
                Overdue
              </span>
            </div>
            <div className="py-4 bg-muted px-(--card-spacing)">
              <span className="text-lg font-bold uppercase text-muted-foreground">
                In Progress
              </span>
            </div>
            <div className="py-4 bg-muted px-(--card-spacing)">
              <span className="text-lg font-bold uppercase text-muted-foreground">
                Up Next
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col w-full gap-8 min-w-100">
        <Card className="border">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl font-semibold">Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-2">
              <div className="flex items-end gap-2 justify-between flex-wrap">
                <div className="flex flex-col">
                  <h2 className="text-3xl font-semibold">{progressValue}%</h2>
                  <label className="text-muted-foreground text-sm font-medium">
                    Based on completed project tasks
                  </label>
                </div>

                <span className="text-2xl font-semibold">
                  {completedTasks.length}/{tasks.length}
                </span>
              </div>
              <Progress
                value={progressValue}
                trackClassName="h-2"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-3 border-t">
              <div className="flex flex-col items-start p-4">
                <span className="text-2xl font-semibold">{tasks.length}</span>
                <span className="text-base text-muted-foreground">
                  Total tasks
                </span>
              </div>
              <div className="flex flex-col items-start p-4 border-l">
                <span className="text-2xl font-semibold">
                  {completedTasks.length}
                </span>
                <span className="text-base text-muted-foreground">
                  Completed tasks
                </span>
              </div>
              <div className="flex flex-col items-start p-4 border-l">
                <span className="text-2xl font-semibold">{daysLeft}d</span>
                <span className="text-base text-muted-foreground">
                  Remaining
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl font-semibold">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {details.map((detail) => (
                <Fragment key={detail.label}>
                  <div className="grid grid-cols-[0.5fr_1fr]">
                    <span className="text-lg font-medium text-muted-foreground">
                      {detail.label}
                    </span>
                    {detail.children}
                  </div>
                  <Separator className="last:hidden" />
                </Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectIdPage;
