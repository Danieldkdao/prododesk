import { ErrorState } from "@/components/error-state";
import { ArrowRightIcon } from "@/components/tiptap/tiptap-icons/arrow-right-icon";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MilestoneStatus, TaskStatus } from "@/db/shared";
import { CreateDocumentButton } from "@/features/documents/components/create-document-button";
import { MilestoneDialog } from "@/features/milestones/components/milestone-dialog";
import { formatMilestoneStatus } from "@/features/milestones/lib/formatters";
import { readProjectAction } from "@/features/projects/actions/actions";
import { formatProjectStatus } from "@/features/projects/lib/formatters";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import {
  formatTaskPriority,
  formatTaskStatus,
} from "@/features/tasks/lib/formatters";
import { formatColor } from "@/lib/formatters";
import { ParamsId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays, format, parse } from "date-fns";
import {
  ClockIcon,
  FileIcon,
  FileTextIcon,
  ListCheckIcon,
  LucideIcon,
  MilestoneIcon,
  PlusIcon,
  ShapesIcon,
  SquareIcon,
} from "lucide-react";
import Link from "next/link";
import { Fragment, ReactNode, Suspense } from "react";

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
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border">
              <CardContent className="flex flex-col gap-1">
                <Skeleton
                  className={cn(
                    "h-12",
                    index === 0 ? "w-24" : index === 3 ? "w-16" : "w-12",
                  )}
                />
                <Skeleton
                  className={cn(
                    "h-6 max-w-full",
                    index === 0
                      ? "w-52"
                      : index === 1
                        ? "w-36"
                        : index === 2
                          ? "w-28"
                          : "w-32",
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-4 w-full rounded-full" />
      </div>
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[3fr_2fr]">
        <Card className="gap-4 border py-5">
          <CardHeader className="px-7">
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  {["w-16", "w-12", "w-14", "w-12"].map((width, index) => (
                    <TableHead key={index}>
                      <Skeleton
                        className={cn("h-4", width, index === 3 && "mx-auto")}
                      />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton
                        className={cn(
                          "h-5 max-w-full",
                          index % 2 === 0 ? "w-40" : "w-28",
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-5 shrink-0" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-5 shrink-0" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="mx-auto h-5 w-20" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="px-7">
            <Skeleton className="h-8 w-32" />
          </CardFooter>
        </Card>
        <Card className="gap-4 border py-5">
          <CardHeader className="px-7">
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="px-7">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex min-w-0 gap-2">
                <div className="mt-0.5 flex shrink-0 flex-col items-center self-stretch">
                  <Skeleton className="size-6 shrink-0 rounded-xl" />
                  {index < 3 && <div className="w-px flex-1 bg-muted" />}
                </div>
                <div
                  className={cn(
                    "flex min-w-0 flex-1 flex-col gap-1",
                    index < 3 && "pb-3",
                  )}
                >
                  <div className="flex flex-wrap items-start gap-2">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <Skeleton
                        className={cn(
                          "h-6 max-w-full",
                          index % 2 === 0 ? "w-44" : "w-32",
                        )}
                      />
                      <Skeleton className="h-5 w-full max-w-64" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-4" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                  <Skeleton className="mt-2 h-5 w-20" />
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="px-7">
            <Skeleton className="h-8 w-40" />
          </CardFooter>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[9fr_11fr]">
        <Card className="gap-4 border py-5">
          <CardHeader className="px-7">
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="px-7">
            <Table>
              <TableBody>
                {Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-5 shrink-0" />
                        <Skeleton
                          className={cn(
                            "h-5 max-w-full",
                            index % 2 === 0 ? "w-36" : "w-48",
                          )}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-5 w-36" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="px-7">
            <Skeleton className="h-8 w-40" />
          </CardFooter>
        </Card>
        <Card className="gap-4 border py-5">
          <CardHeader className="px-7">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="px-7">
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Fragment key={index}>
                  <div className="grid grid-cols-[0.5fr_1fr] items-center">
                    <Skeleton className="h-6 w-20 max-w-full" />

                    <div className="flex items-center gap-2">
                      {(index === 0 || index === 1) && (
                        <Skeleton className="size-5 shrink-0" />
                      )}
                      <Skeleton
                        className={cn(
                          "h-6 max-w-full",
                          index % 2 === 0 ? "w-32" : "w-40",
                        )}
                      />
                    </div>
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

const ProjectIdSuspenseEmptyData = ({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) => {
  return (
    <Card className="border">
      <CardContent className="h-full w-full flex items-center justify-center">
        <div className="w-full flex flex-col items-center justify-center gap-2">
          <Icon className="size-15" />
          <h2 className="text-3xl font-semibold text-center">{title}</h2>
          <p className="text-muted-foreground text-lg text-center max-w-150">
            {description}
          </p>
          <div className="max-w-150 w-full">{children}</div>
        </div>
      </CardContent>
    </Card>
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
  const { area, tasks, documents, milestones } = project;

  const today = new Date();

  const startAt = project.startAt
    ? parse(project.startAt, "yyyy-MM-dd", today)
    : null;
  const endAt = project.endAt
    ? parse(project.endAt, "yyyy-MM-dd", today)
    : null;

  const daysLeft = endAt
    ? differenceInCalendarDays(endAt, today) < 0
      ? 0
      : differenceInCalendarDays(endAt, today)
    : 0;

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

  const taskStatusCounts = Object.fromEntries(
    project.taskCounts.map(({ status, count }) => [status, count]),
  ) as Record<TaskStatus, number>;
  const totalTaskCount = project.taskCounts.reduce(
    (total, item) => total + item.count,
    0,
  );
  const completedTaskCount = taskStatusCounts.completed ?? 0;

  const taskProgress = Math.round(
    (completedTaskCount / (totalTaskCount || 1)) * 100,
  );

  const milestoneStatusCounts = Object.fromEntries(
    project.milestoneCounts.map(({ status, count }) => [status, count]),
  ) as Record<MilestoneStatus, number>;
  const totalMilestoneCount = project.milestoneCounts.reduce(
    (total, item) => total + item.count,
    0,
  );
  const completedMilestoneCount = milestoneStatusCounts.completed ?? 0;

  const openMilestoneCount = totalMilestoneCount - completedMilestoneCount;

  const totalDocumentCount = project.documentCount;

  const projectStats = [
    {
      stat: `${taskProgress}%`,
      label: `${completedTaskCount} of ${totalTaskCount} tasks completed`,
    },
    {
      stat: openMilestoneCount,
      label: "Open milestones",
    },
    {
      stat: totalDocumentCount,
      label: "Documents",
    },
    {
      stat: daysLeft,
      label: "Days remaining",
    },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {projectStats.map((stat, index) => (
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
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4 w-full">
        {tasks.length ? (
          <Card className="border py-5 gap-4">
            <CardHeader className="px-7">
              <CardTitle className="text-xl font-semibold">Next Work</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-center">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const {
                      label: taskStatusLabel,
                      icon: TaskStatusIcon,
                      textColor: taskStatusTextColor,
                    } = formatTaskStatus(task.status);
                    const {
                      label: taskPriorityLabel,
                      icon: TaskPriorityIcon,
                      textColor: taskPriorityTextColor,
                    } = formatTaskPriority(task.priority);

                    return (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium text-base">
                          {task.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TaskStatusIcon
                              className={cn("size-5", taskStatusTextColor)}
                            />
                            <span className="text-base font-medium">
                              {taskStatusLabel}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TaskPriorityIcon
                              className={cn("size-5", taskPriorityTextColor)}
                            />
                            <span className="text-base font-medium">
                              {taskPriorityLabel}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-base">
                          {task.dueAt ? format(task.dueAt, "PP") : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="px-7">
              <Link
                href={`/dashboard/projects/${project.id}/tasks`}
                className={cn(
                  buttonVariants({
                    variant: "ghost",
                    className: "pl-0 hover:bg-tranparent",
                  }),
                )}
              >
                View all tasks
                <ArrowRightIcon />
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <ProjectIdSuspenseEmptyData
            icon={ListCheckIcon}
            title="No Tasks"
            description="You haven't created any tasks yet. Create a new task to
            get started."
          >
            <TaskDialog defaultValues={{ project }}>
              <Button variant="ghost" className="w-full">
                <PlusIcon />
                New Task
              </Button>
            </TaskDialog>
          </ProjectIdSuspenseEmptyData>
        )}
        {milestones.length ? (
          <Card className="border py-5 gap-4">
            <CardHeader className="px-7">
              <CardTitle className="text-xl font-semibold">
                Open Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7">
              {milestones.map((milestone, index) => {
                const isNotLast = index < milestones.length - 1;
                const { label, textColor, bgColor, borderColor } =
                  formatMilestoneStatus(milestone.status);

                return (
                  <div key={milestone.id} className="min-w-0 w-full flex gap-2">
                    <div className="flex shrink-0 flex-col items-center self-stretch mt-0.5">
                      <div
                        className={cn(
                          "size-6 shrink-0 border flex items-center justify-center rounded-xl",
                          bgColor,
                          borderColor,
                        )}
                      >
                        <SquareIcon
                          className={cn("size-4 fill-current", textColor)}
                        />
                      </div>
                      {isNotLast && (
                        <div className="w-px flex-1 bg-muted-foreground/50" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex flex-col gap-0.5 min-w-0 flex-1",
                        isNotLast && "pb-2.5",
                      )}
                    >
                      <div className="flex items-start gap-2 flex-wrap">
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <span className="text-lg font-medium min-w-0 truncate">
                            {milestone.name}
                          </span>
                          <span
                            className={cn(
                              "text-base text-muted-foreground line-clamp-2 max-w-80",
                              !milestone.description && "italic",
                            )}
                          >
                            {milestone.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="size-4 text-muted-foreground" />
                          <span className="font-medium text-muted-foreground">
                            {milestone.dueAt
                              ? format(milestone.dueAt, "PP")
                              : "None"}
                          </span>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "uppercase px-1 py-0.5 mt-2",
                          textColor,
                          bgColor,
                        )}
                      >
                        {label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
            <CardFooter className="px-7">
              <Link
                href={`/dashboard/projects/${project.id}/milestones`}
                className={cn(
                  buttonVariants({
                    variant: "ghost",
                    className: "pl-0 hover:bg-tranparent",
                  }),
                )}
              >
                View all milestones
                <ArrowRightIcon />
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <ProjectIdSuspenseEmptyData
            icon={MilestoneIcon}
            title="No Open Milestones"
            description="You have no milestones that are currently open right now.
            Create a new milestone to get started."
          >
            <MilestoneDialog projectId={project.id}>
              <Button variant="ghost" className="w-full">
                <PlusIcon />
                New Milestone
              </Button>
            </MilestoneDialog>
          </ProjectIdSuspenseEmptyData>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[9fr_11fr] gap-4">
        {documents.length ? (
          <Card className="border py-5 gap-4">
            <CardHeader className="px-7">
              <CardTitle className="text-xl font-semibold">
                Recent Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7">
              <Table>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileIcon className="size-5" />
                          <span className="text-base font-medium">
                            {document.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-base text-right">
                        Updated {format(document.updatedAt, "PP p")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="px-7">
              <Link
                href={`/dashboard/projects/${project.id}/documents`}
                className={cn(
                  buttonVariants({
                    variant: "ghost",
                    className: "pl-0 hover:bg-tranparent",
                  }),
                )}
              >
                View all documents
                <ArrowRightIcon />
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <ProjectIdSuspenseEmptyData
            icon={FileTextIcon}
            title="No Documents"
            description="You haven't created any documents yet. Create your first one to get started."
          >
            <CreateDocumentButton variant="ghost" className="w-full">
              <PlusIcon />
              New Document
            </CreateDocumentButton>
          </ProjectIdSuspenseEmptyData>
        )}
        <Card className="border py-5 gap-4">
          <CardHeader className="px-7">
            <CardTitle className="text-xl font-semibold">
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-7">
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
