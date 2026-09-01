import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/animate-ui/primitives/base/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DailyPlanItemSelectType,
  DailyPlanSelectType,
  TaskSelectType,
} from "@/db/schema";
import { TriggerTaskDetailsButton } from "@/features/tasks/components/trigger-task-details-button";
import {
  formatTaskPriority,
  formatTaskStatus,
} from "@/features/tasks/lib/formatters";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CheckIcon, ChevronDownIcon, ClockIcon, DotIcon } from "lucide-react";
import { Fragment } from "react";

export const ExistingDayPlanCard = ({
  dayPlan,
}: {
  dayPlan: DailyPlanSelectType & {
    items: (DailyPlanItemSelectType & { task: TaskSelectType })[];
  };
}) => {
  const totalTaskCount = dayPlan.items.length;
  const completedTaskCount = dayPlan.items.filter(
    (item) => item.task.status === "completed",
  ).length;
  const planProgress = Math.round(
    (completedTaskCount / (totalTaskCount || 0)) * 100,
  );
  const nextItem = dayPlan.items.find(
    (item) => item.task.status !== "completed",
  );

  return (
    <Card className="py-6 border-2 @container">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2 justify-between w-full flex-wrap">
          <h2 className="text-2xl font-semibold">Today&apos;s plan</h2>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground font-medium text-lg">
              {completedTaskCount} of {totalTaskCount}{" "}
              {totalTaskCount === 1 ? "task" : "tasks"}
            </span>
            <DotIcon className="text-muted-foreground/50" />
            <span className="text-muted-foreground font-medium text-lg">
              {format(new Date(), "MMM M")}
            </span>
          </div>
        </div>
        <Progress value={planProgress} trackClassName="h-4" />
        {nextItem ? (
          <div className="p-4 bg-primary/10 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-lg text-muted-foreground font-medium">
                  Next up
                </span>
                <DotIcon className="text-muted-foreground/50" />
                <span className="text-lg text-muted-foreground font-medium">
                  {nextItem.estimatedMinutes} min
                </span>
              </div>
              <span className="text-xl font-semibold">
                {nextItem.task.name}
              </span>
            </div>
            <TriggerTaskDetailsButton taskId={nextItem.taskId}>
              Start
            </TriggerTaskDetailsButton>
          </div>
        ) : (
          <div className="p-4 bg-emerald-600/10 flex flex-col @xl:flex-row items-start gap-4">
            <CheckIcon className="text-emerald-600 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-emerald-600 text-xl font-semibold">
                Plan complete. Nice work!
              </span>
              <p className="text-emerald-600 text-lg">
                You have completed your plan for today by finishing all tasks in
                the plan. Great job!
              </p>
            </div>
          </div>
        )}
        <Collapsible className="flex flex-col gap-4">
          <CollapsibleTrigger className="flex items-center gap-2 justify-between group/trigger w-full">
            <span className="text-lg font-medium text-muted-foreground">
              View plan tasks ({totalTaskCount})
            </span>
            <ChevronDownIcon className="transition-all duration-200 group-data-panel-open/trigger:rotate-180 text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsiblePanel>
            <div className="scroll-fade max-h-100 min-h-0 overflow-y-auto overscroll-contain pr-2 flex flex-col gap-4">
              {dayPlan.items.map((item) => {
                const isCompleted = item.task.status === "completed";

                const { icon: StatusIcon, textColor: statusTextColor } =
                  formatTaskStatus(item.task.status);
                const {
                  icon: PriorityIcon,
                  textColor: priorityTextColor,
                  label: priority,
                } = formatTaskPriority(item.task.priority);

                return (
                  <Fragment key={item.taskId}>
                    <div className="flex flex-col items-start md:flex-row gap-x-4 gap-y-2 w-full min-w-0">
                      <div className="flex items-center gap-2 justify-between w-full md:w-auto">
                        <StatusIcon className={cn("size-8", statusTextColor)} />
                        <div className="bg-accent border flex items-center gap-2 shrink-0 px-2 py-1 md:hidden">
                          <ClockIcon className="text-muted-foreground size-4.5" />
                          <span className="text-base font-medium text-muted-foreground">
                            {item.estimatedMinutes} min
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span
                          className={cn(
                            "text-xl font-semibold block truncate",
                            isCompleted && statusTextColor,
                            isCompleted && "line-through",
                          )}
                        >
                          {item.task.name}
                        </span>
                        <p
                          className={cn(
                            "text-lg text-muted-foreground line-clamp-2 block",
                            isCompleted && statusTextColor,
                          )}
                        >
                          {item.reason}
                        </p>
                        <div
                          className={cn(
                            "flex items-center gap-2",
                            priorityTextColor,
                          )}
                        >
                          <PriorityIcon className="size-4.5 shrink-0" />
                          <span className="text-base">{priority}</span>
                        </div>
                        <TriggerTaskDetailsButton
                          taskId={item.taskId}
                          size="sm"
                          className="md:w-fit mt-3"
                        >
                          View task
                        </TriggerTaskDetailsButton>
                      </div>
                      <div className="bg-accent border items-center gap-2 shrink-0 px-2 py-1 hidden md:flex">
                        <ClockIcon className="text-muted-foreground size-4.5" />
                        <span className="text-base font-medium text-muted-foreground">
                          {item.estimatedMinutes} min
                        </span>
                      </div>
                    </div>
                    <Separator className="last:hidden" />
                  </Fragment>
                );
              })}
            </div>
          </CollapsiblePanel>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
