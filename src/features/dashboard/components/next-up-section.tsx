import { ErrorState } from "@/components/error-state";
import { LinkButton } from "@/components/link-button";
import { OverviewSuspenseEmptyData } from "@/components/overview-suspense-empty-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardTask } from "@/features/tasks/components/dashboard-task";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { addDays, format } from "date-fns";
import { ListCheckIcon, PlusIcon } from "lucide-react";
import { Suspense } from "react";
import { readDateTasksAction } from "../actions/actions";

export const NextUpSection = () => {
  return (
    <Suspense fallback={<NextUpSectionSkeleton />}>
      <NextUpSectionSuspense />
    </Suspense>
  );
};

export const NextUpSectionSkeleton = () => {
  return (
    <Card
      className="border-2 pt-6 pb-0 min-w-0 gap-0 h-full max-h-175 overflow-hidden"
      aria-label="Loading upcoming tasks"
      aria-busy="true"
    >
      <CardHeader className="px-4 flex items-center gap-2 justify-between border-b">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-28" />
      </CardHeader>
      <CardContent className="px-0 min-w-0 min-h-0 h-full overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 p-4 border-y">
          <Skeleton className="h-15 w-16" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <div className="h-full flex-1 min-h-0 overflow-hidden min-w-0">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="p-4 border-t border-b last:border-b-0 flex flex-col gap-4"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 shrink-0 rounded-full" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton
                  className={index % 2 === 0 ? "h-5 w-4/5" : "h-5 w-3/5"}
                />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="size-2 rounded-full" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const NextUpSectionSuspense = async () => {
  const tomorrow = addDays(new Date(), 1);
  const tasks = await readDateTasksAction(format(tomorrow, "yyyy-MM-dd"));
  if (!tasks)
    return (
      <ErrorState
        title="Something went wrong"
        description="We were unable to load your upcoming tasks. Please try refreshing the page."
      />
    );

  return (
    <Card className="border-2 pt-6 pb-0 min-w-0 gap-0 h-full max-h-175 overflow-hidden">
      <CardHeader className="px-4 flex items-center gap-2 justify-between border-b">
        <CardTitle className="text-xl">Next up</CardTitle>
        <LinkButton href="/dashboard/calendar" variant="ghost">
          View calendar
        </LinkButton>
      </CardHeader>
      <CardContent className="px-0 min-w-0 min-h-0 h-full overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 p-4 border-y">
          <span className="text-6xl font-semibold">
            {format(tomorrow, "dd")}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-xl font-semibold text-muted-foreground">
              {format(tomorrow, "MMM")}
            </span>
            <span className="text-base font-medium text-muted-foreground">
              {format(tomorrow, "EEEE")}
            </span>
          </div>
        </div>
        <div className="h-full flex-1 min-h-0 overflow-y-auto min-w-0">
          {tasks.length ? (
            tasks.map((task) => (
              <DashboardTask key={task.id} task={task} variant="next-up" />
            ))
          ) : (
            <OverviewSuspenseEmptyData
              icon={ListCheckIcon}
              title="No Upcoming Tasks"
              description="You don't have any upcoming tasks scheduled or due tomorrow. Create a new one to get started."
              className="border-none"
            >
              <TaskDialog defaultValues={{ day: addDays(new Date(), 1) }}>
                <Button variant="ghost" className="w-full">
                  <PlusIcon />
                  New Task
                </Button>
              </TaskDialog>
            </OverviewSuspenseEmptyData>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
