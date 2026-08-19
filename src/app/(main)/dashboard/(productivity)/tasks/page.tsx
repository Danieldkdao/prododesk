import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { readTasksAction } from "@/features/tasks/actions/actions";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { TasksFilters } from "@/features/tasks/components/tasks-filters";
import { TasksInfiniteList } from "@/features/tasks/components/tasks-infinite-list";
import { loadTasksSearchParams } from "@/features/tasks/lib/tasks-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { SearchParamsType } from "@/lib/types";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";

const TasksPage = (props: SearchParamsType) => {
  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <h1 className="text-3xl font-semibold">My Tasks</h1>
        <TaskDialog>
          <Button>
            <PlusIcon />
            Create
          </Button>
        </TaskDialog>
      </div>
      <Suspense fallback={<TasksLoading />}>
        <TasksSuspense {...props} />
      </Suspense>
    </div>
  );
};

const TasksLoading = () => {
  return <div>loading</div>;
};

const TasksSuspense = async ({ searchParams }: SearchParamsType) => {
  const filters = await loadTasksSearchParams(searchParams);

  const response = await readTasksAction({ ...filters, page: DEFAULT_PAGE });
  if (!response)
    return (
      <ErrorState
        title="Failed to load tasks"
        description="We were unable to load your tasks. Try refreshing the page or come back later."
      />
    );

  const { tasks, metadata } = response;

  return (
    <div className="flex flex-col gap-4">
      <TasksFilters showAddButton={false} />
      <TasksInfiniteList
        key={metadata.clientKey}
        initialTasks={tasks}
        initialHasNextPage={metadata.hasNextPage}
      />
    </div>
  );
};

export default TasksPage;
