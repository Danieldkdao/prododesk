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
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardTask } from "@/features/tasks/components/dashboard-task";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { ListCheckIcon, PlusIcon } from "lucide-react";
import { Suspense } from "react";
import { readDateTasksAction } from "../actions/actions";

export const TodayTasksSection = () => {
  return (
    <Suspense fallback={<TodayTasksSectionSkeleton />}>
      <TodayTasksSectionSuspense />
    </Suspense>
  );
};

export const TodayTasksSectionSkeleton = () => {
  return (
    <Card
      className="border-2 pt-6 pb-0 min-w-0 gap-0 h-full max-h-175 overflow-hidden"
      aria-label="Loading today's tasks"
      aria-busy="true"
    >
      <CardHeader className="px-4 flex items-center gap-2 justify-between border-b">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-9 w-20" />
      </CardHeader>
      <CardContent className="px-0 min-w-0 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="w-full p-4 border-t border-b last:border-b-0 min-w-0 flex gap-2"
          >
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Skeleton className="size-6 shrink-0 mt-2 rounded-full" />
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <Skeleton
                  className={index % 2 === 0 ? "h-7 w-3/5" : "h-7 w-4/5"}
                />
                <Skeleton className="h-5 w-40 max-w-full" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="size-9 shrink-0" />
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="border-t-2 p-0! justify-center">
        <Skeleton className="h-9 w-28 my-2" />
      </CardFooter>
    </Card>
  );
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
      <CardContent className="px-0 min-w-0 overflow-y-auto h-full">
        {tasks.length ? (
          tasks.map((task) => <DashboardTask key={task.id} task={task} />)
        ) : (
          <OverviewSuspenseEmptyData
            icon={ListCheckIcon}
            title="No Tasks for Today"
            description="You don't have any tasks scheduled or due today. Create a new one to get started."
            className="border-none"
          >
            <TaskDialog defaultValues={{ day: new Date() }}>
              <Button variant="ghost" className="w-full">
                <PlusIcon />
                New Task
              </Button>
            </TaskDialog>
          </OverviewSuspenseEmptyData>
        )}
      </CardContent>
      {tasks.length ? (
        <CardFooter className="border-t-2 p-0!">
          <TaskDialog defaultValues={{ day: new Date() }}>
            <Button variant="ghost" className="w-full">
              <PlusIcon />
              New Task
            </Button>
          </TaskDialog>
        </CardFooter>
      ) : null}
    </Card>
  );
};
