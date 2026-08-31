import { ProjectSelectType } from "@/db/schema";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowUpRightIcon,
  ClockIcon,
  DotIcon,
  FolderKanbanIcon,
} from "lucide-react";
import Link from "next/link";
import { formatProjectStatus } from "../lib/formatters";

export const DashboardProjectCard = ({
  project,
}: {
  project: ProjectSelectType;
}) => {
  const { icon: Icon, text: statusText } = formatProjectStatus(project.status);

  return (
    <Link
      key={project.id}
      href={`/dashboard/projects/${project.id}`}
      className="group min-w-0"
    >
      <div className="h-full flex items-start gap-3 transition-colors hover:bg-muted/40 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">
          {project.icon || <FolderKanbanIcon className="size-5" />}
        </div>
        <div className="flex flex-col gap-0.5 w-full min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <span className="truncate text-xl font-semibold">
                {project.name}
              </span>
              <ArrowUpRightIcon className="size-5 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            <p
              className={cn(
                "line-clamp-2 text-base leading-relaxed text-muted-foreground",
                !project.outcome && "italic",
              )}
            >
              {project.outcome || "No outcome provided."}
            </p>
            <div className="flex items-center gap-0.5 mt-1 flex-wrap">
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground shrink-0" />
                <span className="text-base text-muted-foreground">
                  {statusText}
                </span>
              </div>
              <DotIcon className="text-muted-foreground/30 size-5" />
              <div className="flex items-center gap-2">
                <ClockIcon className="size-4 text-muted-foreground shrink-0" />
                <span className="text-base text-muted-foreground">
                  {formatDistanceToNow(project.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
