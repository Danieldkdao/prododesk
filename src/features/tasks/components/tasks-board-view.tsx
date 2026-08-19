import { SearchParamsType } from "@/lib/types";
import { Suspense } from "react";
import { loadTasksSearchParams } from "../lib/tasks-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { readTasksAction } from "../actions/actions";
import { ErrorState } from "@/components/error-state";
import { TasksBoardViewClient } from "./tasks-board-view-client";

export const TasksBoardView = (props: SearchParamsType) => {
  return (
    <Suspense fallback={<TasksBoardViewLoading />}>
      <TasksBoardViewSuspense {...props} />
    </Suspense>
  );
};

const TasksBoardViewLoading = () => {
  return <div>loading</div>;
};

const TasksBoardViewSuspense = async ({ searchParams }: SearchParamsType) => {
  const filters = await loadTasksSearchParams(searchParams);

  const response = await readTasksAction({
    ...filters,
    page: DEFAULT_PAGE,
    allTasks: true,
  });
  if (!response)
    return (
      <ErrorState
        title="Failed to load tasks"
        description="We were unable to load your tasks. Try refreshing the page or come back later."
      />
    );

  return <TasksBoardViewClient response={response} />;
};
