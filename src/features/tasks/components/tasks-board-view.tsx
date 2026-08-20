import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";
import { loadTasksSearchParams } from "../lib/tasks-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { readTasksAction } from "../actions/actions";
import { ErrorState } from "@/components/error-state";
import { TasksBoardViewClient } from "./tasks-board-view-client";
import { Skeleton } from "@/components/ui/skeleton";

type TasksBoardViewProps = {
  params?: Promise<
    Partial<Awaited<ParamsId<"areaId" | "projectId">["params"]>>
  >;
} & SearchParamsType;

export const TasksBoardView = (props: TasksBoardViewProps) => {
  return (
    <Suspense fallback={<TasksBoardViewLoading />}>
      <TasksBoardViewSuspense {...props} />
    </Suspense>
  );
};

const TasksBoardViewLoading = () => {
  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-hidden">
      <div className="flex h-9 items-center gap-2 px-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="w-full min-w-0 overflow-auto">
        <div className="grid min-w-300 grid-cols-4 gap-4">
          {[3, 2, 3, 2].map((taskCount, columnIndex) => (
            <div
              key={columnIndex}
              className="flex min-h-72 flex-col gap-2 bg-muted"
            >
              <div className="flex items-center gap-2 px-4 pt-4">
                <Skeleton className="size-5 shrink-0 rounded-full bg-background/70" />
                <Skeleton className="h-6 w-24 bg-background/70" />
                <Skeleton className="ml-auto size-8 bg-background/70" />
              </div>
              <div className="flex flex-col gap-2 p-2">
                {Array.from({ length: taskCount }).map((_, taskIndex) => (
                  <div
                    key={taskIndex}
                    className="flex min-h-28 gap-2 bg-background p-4"
                  >
                    <Skeleton className="mt-1 size-5 shrink-0 rounded-full" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Skeleton
                        className={
                          taskIndex % 2 === 0 ? "h-5 w-3/4" : "h-5 w-1/2"
                        }
                      />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <Skeleton className="size-8 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TasksBoardViewSuspense = async ({
  params,
  searchParams,
}: TasksBoardViewProps) => {
  const projectId = params ? (await params).projectId : undefined;
  const areaId = params ? (await params).areaId : undefined;

  const filters = await loadTasksSearchParams(searchParams);

  const response = await readTasksAction({
    ...filters,
    page: DEFAULT_PAGE,
    allTasks: true,
    projectIds: projectId ? [projectId] : undefined,
    areaIds: areaId ? [areaId] : undefined,
  });
  if (!response)
    return (
      <ErrorState
        title="Failed to load tasks"
        description="We were unable to load your tasks. Try refreshing the page or come back later."
      />
    );

  return (
    <TasksBoardViewClient
      response={response}
      projectId={projectId ?? undefined}
    />
  );
};
