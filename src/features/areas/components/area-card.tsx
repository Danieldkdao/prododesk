import { ListTodoIcon } from "@/components/tiptap/tiptap-icons/list-todo-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProjectDialog } from "@/features/projects/components/project-dialog";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { formatColor } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ClockIcon,
  EllipsisIcon,
  FolderPlusIcon,
  PlusIcon,
  ShapesIcon,
} from "lucide-react";
import Link from "next/link";
import { ReadAreasActionReturnType } from "../actions/actions";
import { AreaOptions } from "./area-options";
import { ToggleAreaArchiveStatusButton } from "./toggle-area-archive-status-button";
import { Button } from "@/components/ui/button";

export const AreaCard = ({
  area,
}: {
  area: ReadAreasActionReturnType["areas"][number];
}) => {
  const { bgLight, text, bg } = formatColor(area.color);

  const areaProgress = Math.round(
    (area.completeTaskCount / area.taskCount) * 100,
  );

  const stats = [
    {
      label: "active",
      stat: area.activeProjectCount,
    },
    {
      label: "projects",
      stat: area.projectCount,
    },
    {
      label: "tasks",
      stat: area.taskCount,
    },
  ];

  return (
    <Card className="p-0 border bg-card h-full relative">
      <CardContent className="p-0 flex h-full">
        <Link href={`/dashboard/areas/${area.id}`}>
          <span className="absolute inset-0" />
        </Link>
        <div
          className={cn(
            "w-1/5 h-full p-4 flex items-center justify-center shrink-0",
            bgLight,
          )}
        >
          {area.icon ? (
            <span className={cn("text-[clamp(1.75rem,4vw+2rem,4.5rem)]", text)}>
              {area.icon}
            </span>
          ) : (
            <ShapesIcon className={cn("size-20", text)} />
          )}
        </div>
        <div className="flex-1 min-w-0 p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2 w-full min-w-0">
            <div className="flex items-start gap-2 w-full">
              <div className="flex flex-col gap-0.5 flex-1">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-2xl font-semibold">{area.name}</span>
                  {area.isArchived && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-yellow-400/20 text-yellow-500">
                      <ArchiveIcon className="size-5" />
                      <span>Archived</span>
                    </div>
                  )}
                </div>
                {area.description ? (
                  <p className="text-lg text-muted-foreground line-clamp-2">
                    {area.description}
                  </p>
                ) : (
                  <div className="flex items-start gap-2 leading-7 group">
                    <span className="h-[1lh] flex items-center shrink-0">
                      <PlusIcon className={cn("size-4 shrink-0", text)} />
                    </span>
                    <p className={cn("text-lg group-hover:underline", text)}>
                      Add a description to clarify what belongs here
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 relative z-10">
                <AreaOptions area={area}>
                  <Button variant="ghost" size="icon-sm">
                    <EllipsisIcon />
                  </Button>
                </AreaOptions>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{stat.stat}</span>
                  <span className="text-muted-foreground text-base">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {area.taskCount ? (
            <div className="flex flex-col gap-1">
              <div className="w-full flex items-center gap-2 justify-between">
                <span className="text-muted-foreground text-base">
                  Area progress
                </span>
                <span className="text-muted-foreground text-base font-medium">
                  {areaProgress}%
                </span>
              </div>
              <Progress
                value={areaProgress}
                className="w-full"
                indicatorClassName={bg}
                trackClassName="h-2"
              />
            </div>
          ) : area.projectCount ? (
            <TaskDialog nativeButton={false}>
              <div className="p-2 bg-muted flex items-start leading-6 gap-2 relative z-10 cursor-pointer">
                <span className="h-[1lh] flex items-center">
                  <ListTodoIcon className="text-muted-foreground size-5 shrink-0" />
                </span>
                <span className="text-muted-foreground text-base">
                  No tasks yet · Create the first task
                </span>
              </div>
            </TaskDialog>
          ) : (
            <ProjectDialog defaultValues={{ area }} nativeButton={false}>
              <div className="p-2 bg-muted flex items-start leading-6 gap-2 relative z-10 cursor-pointer">
                <span className="h-[1lh] flex items-center">
                  <FolderPlusIcon className="text-muted-foreground size-5 shrink-0" />
                </span>
                <span className="text-muted-foreground text-base">
                  No projects yet · Create the first project
                </span>
              </div>
            </ProjectDialog>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-start gap-2 leading-6">
              <span className="h-[1lh] shrink-0 flex items-center">
                <ClockIcon className="size-5 text-muted-foreground" />
              </span>
              <span className="text-base text-muted-foreground">
                {area.isArchived && area.archivedAt
                  ? `Archived ${formatDistanceToNow(area.archivedAt, { includeSeconds: true, addSuffix: true })}`
                  : `Last updated ${formatDistanceToNow(area.updatedAt, { includeSeconds: true, addSuffix: true })}`}
              </span>
            </div>
            {area.isArchived && (
              <ToggleAreaArchiveStatusButton
                areaId={area.id}
                newArchiveStatus={!area.isArchived}
                variant="outline"
                size="xs"
                className="relative z-10"
              >
                <ArchiveRestoreIcon />
                Restore
              </ToggleAreaArchiveStatusButton>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
