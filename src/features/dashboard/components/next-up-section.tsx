import { ErrorState } from "@/components/error-state";
import { LinkButton } from "@/components/link-button";
import { OverviewSuspenseEmptyData } from "@/components/overview-suspense-empty-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardTask } from "@/features/tasks/components/dashboard-task";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { addDays, format } from "date-fns";
import { ListCheckIcon, PlusIcon } from "lucide-react";
import { Suspense } from "react";
import { readDateTasksAction } from "../actions/actions";

export const NextUpSection = () => {
  return (
    <Suspense fallback={<NextUpSectionLoading />}>
      <NextUpSectionSuspense />
    </Suspense>
  );
};

const NextUpSectionLoading = () => {
  return <div>loading</div>;
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
