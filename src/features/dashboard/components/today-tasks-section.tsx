import { ErrorState } from "@/components/error-state";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardTask } from "@/features/tasks/components/dashboard-task";
import { Suspense } from "react";
import { readTodayTasksAction } from "../actions/actions";
import { LinkButton } from "@/components/link-button";
import { OverviewSuspenseEmptyData } from "@/components/overview-suspense-empty-data";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { Button } from "@/components/ui/button";
import { ListCheckIcon, PlusIcon } from "lucide-react";
import { addHours } from "date-fns";

export const TodayTasksSection = () => {
  return (
    <Suspense fallback={<TodayTasksSectionLoading />}>
      <TodayTasksSectionSuspense />
    </Suspense>
  );
};

const TodayTasksSectionLoading = () => {
  return <div>loading</div>;
};

const TodayTasksSectionSuspense = async () => {
  const tasks = await readTodayTasksAction();
  if (!tasks)
    return (
      <ErrorState
        title="Something went wrong"
        description="We were unable to load your tasks for today. Try refreshing the page or checking the URL."
      />
    );

  return (
    <Card className="border-2 pt-6 pb-0 min-w-0">
      <CardHeader className="px-4 flex items-center gap-2 justify-between border-b">
        <CardTitle className="text-xl">Today&apos;s focus</CardTitle>
        <LinkButton href="/dashboard/tasks" variant="ghost">
          View all
        </LinkButton>
      </CardHeader>
      <CardContent className="px-0 min-w-0">
        {tasks.length ? (
          tasks.map((task) => <DashboardTask key={task.id} task={task} />)
        ) : (
          <OverviewSuspenseEmptyData
            icon={ListCheckIcon}
            title="No Tasks for Today"
            description="You don't have any tasks scheduled or due today. Create a new one to get started."
            className="border-none"
          >
            <TaskDialog defaultValues={{ day: addHours(new Date(), 1) }}>
              <Button variant="ghost" className="w-full">
                <PlusIcon />
                New Task
              </Button>
            </TaskDialog>
          </OverviewSuspenseEmptyData>
        )}
      </CardContent>
    </Card>
  );
};
