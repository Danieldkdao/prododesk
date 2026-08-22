import { LinkButton } from "@/components/link-button";
import { OverviewSuspenseEmptyData } from "@/components/overview-suspense-empty-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectStatus, TaskStatus } from "@/db/shared";
import {
  formatActivityMessage,
  formatActivitySubject,
} from "@/features/activity/lib/formatters";
import { readAreaAction } from "@/features/areas/actions/actions";
import { CreateDocumentButton } from "@/features/documents/components/create-document-button";
import { OverviewDocumentsTable } from "@/features/documents/overview-documents-table";
import { DashboardProjectCard } from "@/features/projects/components/dashboard-project-card";
import { ProjectDialog } from "@/features/projects/components/project-dialog";
import { formatProjectStatus } from "@/features/projects/lib/formatters";
import { OverviewTasksTable } from "@/features/tasks/components/overview-tasks-table";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { formatColor } from "@/lib/formatters";
import { ParamsId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  ActivityIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  ClockIcon,
  DotIcon,
  FileTextIcon,
  FolderKanbanIcon,
  ListCheckIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { Fragment, Suspense } from "react";

type AreaIdParams = ParamsId<"areaId">;

const AreaIdPage = (props: AreaIdParams) => {
  return (
    <Suspense fallback={<AreaIdLoading />}>
      <AreaIdSuspense {...props} />
    </Suspense>
  );
};

const AreaIdLoading = () => {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border">
              <CardContent className="flex flex-col gap-2">
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-6 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-4 w-full rounded-full" />
      </div>
      <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <Card className="gap-4 border py-5">
          <CardHeader className="px-5">
            <Skeleton className="h-6 w-28" />
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b px-2 py-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="mx-auto h-4 w-10" />
            </div>
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 border-b px-2 py-4 last:border-b-0"
              >
                <Skeleton className="h-5 w-4/5" />
                <div className="flex items-center gap-2">
                  <Skeleton className="size-5 shrink-0 rounded-full" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="size-5 shrink-0 rounded-full" />
                  <Skeleton className="h-5 w-14" />
                </div>
                <Skeleton className="mx-auto h-5 w-16" />
              </div>
            ))}
          </CardContent>
          <CardFooter className="px-5">
            <div className="flex h-9 items-center gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="size-4" />
            </div>
          </CardFooter>
        </Card>
        <Card className="gap-4 border py-5">
          <CardHeader className="px-5">
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-start gap-3 border-b pb-3 last:border-b-0 last:pb-0"
              >
                <Skeleton className="mt-0.5 size-5 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Skeleton
                    className={index % 2 === 0 ? "h-5 w-full" : "h-5 w-4/5"}
                  />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="px-5">
            <div className="flex h-9 items-center gap-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="size-4" />
            </div>
          </CardFooter>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[11fr_9fr]">
        <Card className="gap-4 border py-5 @container">
          <CardHeader className="px-5">
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 px-4 @xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3 p-4">
                <Skeleton className="size-10 shrink-0 rounded-xl" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="size-5 shrink-0" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="mt-1 flex items-center gap-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="px-5">
            <div className="flex h-9 items-center gap-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="size-4" />
            </div>
          </CardFooter>
        </Card>
        <Card className="gap-4 border py-5">
          <CardHeader className="px-5">
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col px-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 border-b py-4 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Skeleton className="size-5 shrink-0" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-5 w-28 shrink-0" />
              </div>
            ))}
          </CardContent>
          <CardFooter className="px-5">
            <div className="flex h-9 items-center gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="size-4" />
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

const AreaIdSuspense = async ({ params }: AreaIdParams) => {
  const { areaId } = await params;
  const area = await readAreaAction(areaId);
  if (!area) return null;

  const { tasks, documents, projects, activity, overdueTaskCount } = area;

  const { bg: colorBg, text: colorText } = formatColor(area.color);

  const taskStatusCounts = Object.fromEntries(
    area.taskCounts.map(({ status, count }) => [status, count]),
  ) as Record<TaskStatus, number>;
  const projectStatusCounts = Object.fromEntries(
    area.projectCounts.map(({ status, count }) => [status, count]),
  ) as Record<ProjectStatus, number>;

  const completedTaskCount = taskStatusCounts.completed ?? 0;
  const totalTaskCount = area.taskCounts.reduce((a, b) => a + b.count, 0);
  const openTaskCount = totalTaskCount - completedTaskCount;

  const activeProjectCount = projectStatusCounts.active ?? 0;

  const taskProgress = Math.round(
    (completedTaskCount / (totalTaskCount || 1)) * 100,
  );

  const areaStats = [
    {
      stat: activeProjectCount,
      label: "Active projects",
    },
    {
      stat: openTaskCount,
      label: "Open tasks",
    },
    {
      stat: `${taskProgress}%`,
      label: `${completedTaskCount} of ${totalTaskCount} tasks completed`,
    },
    {
      stat: overdueTaskCount,
      label: "Overdue tasks",
    },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {areaStats.map((stat, index) => (
            <Card key={index} className="border">
              <CardContent className="flex flex-col gap-0.5">
                <h2 className={cn("text-5xl font-semibold", colorText)}>
                  {stat.stat}
                </h2>
                <span className="text-muted-foreground text-xl font-medium">
                  {stat.label}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
        <Progress
          value={taskProgress}
          indicatorClassName={colorBg}
          trackClassName="h-4"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 w-full">
        {tasks.length ? (
          <Card className="border py-5 gap-4">
            <CardHeader className="px-5">
              <CardTitle className="text-xl font-semibold">Next Work</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <OverviewTasksTable tasks={tasks} />
            </CardContent>
            <CardFooter className="px-5">
              <LinkButton
                href={`/dashboard/areas/${area.id}/tasks`}
                variant="ghost"
                className="pl-0 hover:bg-transparent"
              >
                View all tasks
                <ArrowRightIcon />
              </LinkButton>
            </CardFooter>
          </Card>
        ) : (
          <OverviewSuspenseEmptyData
            icon={ListCheckIcon}
            title="No Tasks"
            description="You haven't created any tasks yet. Create a new task to
            get started."
          >
            <TaskDialog>
              <Button variant="ghost" className="w-full">
                <PlusIcon />
                New Task
              </Button>
            </TaskDialog>
          </OverviewSuspenseEmptyData>
        )}
        {activity.length ? (
          <Card className="border py-5 gap-4">
            <CardHeader className="px-5">
              <CardTitle className="text-xl font-semibold">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 flex flex-col gap-2">
              {activity.map((a) => {
                const { icon: SubjectIcon } = formatActivitySubject(a.subject);

                return (
                  <Fragment key={a.id}>
                    <div
                      key={a.id}
                      className="flex items-start gap-2 w-full min-w-0 leading-7"
                    >
                      <span className="h-[1lh] flex items-center shrink-0">
                        <SubjectIcon className="text-muted-foreground" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg text-muted-foreground">
                          {formatActivityMessage(a)}
                        </p>
                      </div>
                    </div>
                    <Separator className="last:hidden" />
                  </Fragment>
                );
              })}
            </CardContent>
            <CardFooter className="px-5">
              <LinkButton
                href={`/dashboard/areas/${area.id}/activity`}
                variant="ghost"
                className="pl-0 hover:bg-transparent"
              >
                View all activity
                <ArrowRightIcon />
              </LinkButton>
            </CardFooter>
          </Card>
        ) : (
          <OverviewSuspenseEmptyData
            icon={ActivityIcon}
            title="No Activity"
            description="This section will be populated once you have done some activity inside of this area."
          />
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[11fr_9fr] gap-4">
        {projects.length ? (
          <Card className="border py-5 gap-4 @container">
            <CardHeader className="px-5">
              <CardTitle className="text-xl font-semibold">Projects</CardTitle>
            </CardHeader>
            <CardContent className="px-4 grid grid-cols-1 @xl:grid-cols-2">
              {projects.map((project) => (
                <DashboardProjectCard key={project.id} project={project} />
              ))}
            </CardContent>
            <CardFooter className="px-5">
              <LinkButton
                href={`/dashboard/areas/${area.id}/projects`}
                variant="ghost"
                className="pl-0 hover:bg-transparent"
              >
                View all projects
                <ArrowRightIcon />
              </LinkButton>
            </CardFooter>
          </Card>
        ) : (
          <OverviewSuspenseEmptyData
            icon={FolderKanbanIcon}
            title="No Projects"
            description="You haven't created any projects yet. Create a new project to
            get started."
          >
            <ProjectDialog defaultValues={{ area }}>
              <Button variant="ghost" className="w-full">
                <PlusIcon />
                New Project
              </Button>
            </ProjectDialog>
          </OverviewSuspenseEmptyData>
        )}
        {documents.length ? (
          <Card className="border py-5 gap-4">
            <CardHeader className="px-5">
              <CardTitle className="text-xl font-semibold">
                Recent Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5">
              <OverviewDocumentsTable documents={documents} />
            </CardContent>
            <CardFooter className="px-5">
              <LinkButton
                href={`/dashboard/areas/${area.id}/documents`}
                variant="ghost"
                className="pl-0 hover:bg-transparent"
              >
                View all documents
                <ArrowRightIcon />
              </LinkButton>
            </CardFooter>
          </Card>
        ) : (
          <OverviewSuspenseEmptyData
            icon={FileTextIcon}
            title="No Documents"
            description="You haven't created any documents yet. Create your first one to get started."
          >
            <CreateDocumentButton variant="ghost" className="w-full">
              <PlusIcon />
              New Document
            </CreateDocumentButton>
          </OverviewSuspenseEmptyData>
        )}
      </div>
    </div>
  );
};

export default AreaIdPage;
