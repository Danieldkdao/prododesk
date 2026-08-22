import { ErrorState } from "@/components/error-state";
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
import { DashboardTask } from "@/features/tasks/components/dashboard-task";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { addHours } from "date-fns";
import { ListCheckIcon, PlusIcon } from "lucide-react";
import { Suspense } from "react";
import { readDateTasksAction } from "../actions/actions";

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
  const tasks = await readDateTasksAction();
  if (!tasks)
    return (
      <ErrorState
        title="Something went wrong"
        description="We were unable to load your tasks for today. Try refreshing the page or checking the URL."
      />
    );

  return (
    <Card className="border-2 pt-6 pb-0 min-w-0 gap-0 h-full max-h-175 overflow-hidden">
      <CardHeader className="px-4 flex items-center gap-2 justify-between border-b">
        <CardTitle className="text-xl">Today&apos;s focus</CardTitle>
        <LinkButton href="/dashboard/tasks" variant="ghost">
          View all
        </LinkButton>
      </CardHeader>
      <CardContent className="px-0 min-w-0 overflow-y-auto">
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
      <CardFooter className="border-t-2 p-0!">
        <TaskDialog defaultValues={{ day: addHours(new Date(), 1) }}>
          <Button variant="ghost" className="w-full">
            <PlusIcon />
            New Task
          </Button>
        </TaskDialog>
      </CardFooter>
    </Card>
  );
};
