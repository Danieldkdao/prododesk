import { ErrorState } from "@/components/error-state";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { taskStatuses } from "@/db/shared";
import { readProjectAction } from "@/features/projects/actions/actions";
import { formatProjectStatus } from "@/features/projects/lib/formatters";
import { Task } from "@/features/tasks/components/task";
import { formatTaskStatus } from "@/features/tasks/lib/formatters";
import { formatColor } from "@/lib/formatters";
import { ParamsId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays, format, parse } from "date-fns";
import { ShapesIcon } from "lucide-react";
import Link from "next/link";
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
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="flex w-full min-w-0 flex-col gap-8">
        <Card className="h-full w-full border">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          <CardContent className="@container flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 @xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="border bg-muted/20 p-4">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-3 h-9 w-10" />
                </div>
              ))}
            </div>
            <div className="bg-muted p-4">
              <Skeleton className="h-6 w-28 bg-background/70" />
            </div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex min-w-0 items-center gap-4 border p-4"
                >
                  <Skeleton className="size-5 shrink-0" />
                  <Skeleton className="size-9 shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton
                      className={cn(
                        "h-5",
                        index === 0 ? "w-2/3" : index === 1 ? "w-1/2" : "w-3/4",
                      )}
                    />
                    <Skeleton className="h-4 w-40 max-w-full" />
                  </div>
                  <Skeleton className="h-7 w-20 shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-8 lg:min-w-100">
        <Card className="border">
          <CardHeader className="border-b">
            <Skeleton className="h-8 w-28" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-end justify-between gap-2">
                <div className="space-y-2">
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-4 w-52" />
                </div>

                <Skeleton className="h-8 w-14" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="grid grid-cols-3 border-t">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className={cn("space-y-2 p-4", index > 0 && "border-l")}
                >
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-5 w-full max-w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardHeader className="border-b">
            <Skeleton className="h-8 w-24" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[0.5fr_1fr] items-center border-b py-3 last:border-b-0"
                >
                  <Skeleton className="h-5 w-20" />
                  <Skeleton
                    className={cn("h-6", index % 2 === 0 ? "w-32" : "w-24")}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
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

  const completedTasks = tasks.filter((task) => task.status === "completed");
  const progressValue = Math.round(
    (completedTasks.length / (tasks.length || 1)) * 100,
  );

  const today = new Date();

  const startAt = project.startAt
    ? parse(project.startAt, "yyyy-MM-dd", today)
    : null;
  const endAt = project.endAt
    ? parse(project.endAt, "yyyy-MM-dd", today)
    : null;

  const daysLeft = endAt ? differenceInCalendarDays(endAt, today) : 0;

  const {
    label: colorLabel,
    bg: colorBg,
    text: colorText,
  } = formatColor(project.color);
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

  const taskStats = taskStatuses.map((status) => ({
    label: formatTaskStatus(status).label,
    icon: formatTaskStatus(status).icon,
    taskCount: tasks.filter((task) => task.status === status).length,
  }));

  const upcomingTasks = tasks.filter(
    (task) =>
      task.scheduledAt &&
      task.scheduledAt > new Date() &&
      task.status !== "completed",
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-8">
      <div className="flex flex-col w-full min-w-0 gap-8">
        <Card className="border w-full h-full">
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl font-semibold flex-1">
                Project tasks
              </CardTitle>
              <Link
                href={`/dashboard/projects/${project.id}/tasks`}
                className={cn("text-lg font-medium", colorText)}
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="@container flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-3 @xl:grid-cols-4">
              {taskStats.map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-0 border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                >
                  <dt className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </dt>

                  <dd className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                    {stat.taskCount}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="p-4 bg-muted">
              <span className="text-xl font-semibold uppercase text-muted-foreground">
                Upcoming
              </span>
            </div>
            <div className="w-full flex flex-col gap-2">
              {upcomingTasks.map((task, index) => (
                <Task
                  key={task.id}
                  task={{ ...task, project }}
                  includeDay
                  index={index}
                />
              ))}
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
                indicatorClassName={colorBg}
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
