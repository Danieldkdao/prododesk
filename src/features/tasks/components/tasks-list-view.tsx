import { ErrorState } from "@/components/error-state";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEFAULT_PAGE } from "@/lib/constants";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";
import { readTasksAction } from "../actions/actions";
import { loadTasksSearchParams } from "../lib/tasks-params";
import { AreaProjectTaskSkeleton } from "./area-project-tasks-skeleton";
import { TasksInfiniteList } from "./tasks-infinite-list";
import { AreaTasksInfiniteList } from "./area-tasks-infinite-list";
import { ProjectTasksInfiniteList } from "./project-tasks-infinite-list";

type TasksListViewProps = {
  params?: Promise<
    Partial<Awaited<ParamsId<"areaId" | "projectId">["params"]>>
  >;
  showProject?: boolean;
} & SearchParamsType;

export const TasksListView = (props: TasksListViewProps) => {
  return (
    <Suspense fallback={<ListViewLoading showProject={props.showProject} />}>
      <ListViewSuspense {...props} />
    </Suspense>
  );
};

const ListViewLoading = ({
  showProject = false,
}: {
  showProject?: boolean;
}) => {
  return (
    <div className="w-full overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Scheduled At</TableHead>
            <TableHead>Due At</TableHead>
            {showProject && <TableHead>Project</TableHead>}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, index) => (
            <AreaProjectTaskSkeleton key={index} showProject={showProject} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const ListViewSuspense = async ({
  params,
  searchParams,
}: TasksListViewProps) => {
  const projectId = params ? (await params).projectId : undefined;
  const areaId = params ? (await params).areaId : undefined;

  const filters = await loadTasksSearchParams(searchParams);

  const response = await readTasksAction({
    ...filters,
    page: DEFAULT_PAGE,
    projectIds: projectId ? [projectId] : undefined,
    areaIds: areaId ? [areaId] : undefined,
  });
  if (!response) {
    return (
      <ErrorState
        title="Failed to load tasks"
        description="We were unable to load your tasks. Try refreshing the page or come back later."
      />
    );
  }

  const { tasks, metadata } = response;

  const listProps = {
    initialTasks: tasks,
    initialHasNextPage: metadata.hasNextPage,
  };

  const currentProject = metadata.projects.find(
    (project) => project.id === projectId,
  );

  if (areaId)
    return (
      <AreaTasksInfiniteList
        key={metadata.clientKey}
        areaId={areaId}
        {...listProps}
      />
    );
  if (currentProject)
    return (
      <ProjectTasksInfiniteList
        key={metadata.clientKey}
        project={currentProject}
        {...listProps}
        allTasksCompleted={metadata.allTasksCompleted}
      />
    );

  return <TasksInfiniteList key={metadata.clientKey} {...listProps} />;
};
