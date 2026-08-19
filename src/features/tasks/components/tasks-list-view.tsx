import { ErrorState } from "@/components/error-state";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEFAULT_PAGE } from "@/lib/constants";
import { SearchParamsType } from "@/lib/types";
import { Suspense } from "react";
import { readTasksAction } from "../actions/actions";
import { loadTasksSearchParams } from "../lib/tasks-params";
import { AreaProjectTaskSkeleton } from "./area-project-tasks-skeleton";
import { TasksInfiniteList } from "./tasks-infinite-list";

export const TasksListView = (props: SearchParamsType) => {
  return (
    <Suspense fallback={<ListViewLoading />}>
      <ListViewSuspense {...props} />
    </Suspense>
  );
};

const ListViewLoading = () => {
  return (
    <div className="w-full overflow-hidden border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Scheduled At</TableHead>
            <TableHead>Due At</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, index) => (
            <AreaProjectTaskSkeleton key={index} showProject />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const ListViewSuspense = async ({ searchParams }: SearchParamsType) => {
  const filters = await loadTasksSearchParams(searchParams);

  const response = await readTasksAction({ ...filters, page: DEFAULT_PAGE });
  if (!response) {
    return (
      <ErrorState
        title="Failed to load tasks"
        description="We were unable to load your tasks. Try refreshing the page or come back later."
      />
    );
  }

  const { tasks, metadata } = response;

  return (
    <TasksInfiniteList
      key={metadata.clientKey}
      initialTasks={tasks}
      initialHasNextPage={metadata.hasNextPage}
    />
  );
};
