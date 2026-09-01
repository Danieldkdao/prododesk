import { ErrorState } from "@/components/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertCircleIcon, CalendarCheckIcon, InboxIcon } from "lucide-react";
import { Suspense } from "react";
import { readDayPlanAction, readPlanMyDayDataAction } from "../actions/actions";
import { formatPlannerCardState } from "../lib/formatters";
import { ExistingDayPlanCard } from "./existing-day-plan-card";
import { Skeleton } from "@/components/ui/skeleton";

export const PlanMyDayCard = () => {
  return (
    <Suspense fallback={<PlanMyDayCardLoading />}>
      <PlanMyDayCardSuspense />
    </Suspense>
  );
};

export const PlanMyDayCardLoading = () => {
  return (
    <Card
      className="border-2 bg-linear-to-br from-primary/5 to-card py-6"
      aria-label="Loading your daily plan"
      aria-busy="true"
    >
      <CardContent className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 px-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-44 max-w-full" />
            <div className="flex max-w-150 flex-col gap-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton className="size-5 shrink-0" />
                <Skeleton className={index === 1 ? "h-5 w-28" : "h-5 w-24"} />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-10 w-28 shrink-0" />
      </CardContent>
    </Card>
  );
};

const PlanMyDayCardSuspense = async () => {
  const existingDayPlan = await readDayPlanAction();
  if (existingDayPlan) {
    return <ExistingDayPlanCard dayPlan={existingDayPlan} />;
  }
  const response = await readPlanMyDayDataAction();
  if (!response)
    return (
      <ErrorState
        title="Something went wrong"
        description="We couldn't fetch your plan for the day."
      />
    );

  const { todayTaskCount, tasksNeedAttentionCount, unsortedTaskCount } =
    response;

  const items = [
    {
      label: `${todayTaskCount} task${todayTaskCount === 1 ? "" : "s"} today`,
      icon: CalendarCheckIcon,
      textColor: "text-foreground",
    },
    {
      label: `${tasksNeedAttentionCount} need${tasksNeedAttentionCount === 1 ? "s" : ""} attention`,
      icon: AlertCircleIcon,
      textColor: "text-destructive",
    },
    {
      label: `${unsortedTaskCount} unsorted`,
      icon: InboxIcon,
      textColor: "text-foreground",
    },
  ];

  const {
    title,
    description,
    actionButton: ActionButton,
  } = formatPlannerCardState(
    response.state === "single"
      ? {
          state: "single",
          source: response.source,
          taskId: response.singleTask.id,
        }
      : { state: response.state },
  );

  return (
    <Card className="py-6 border-2 bg-linear-to-br from-primary/5 to-card">
      <CardContent className="flex items-center gap-x-8 gap-y-4 px-6 justify-between flex-wrap">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="text-lg text-muted-foreground font-medium max-w-150">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <item.icon className={cn("size-5", item.textColor)} />
                <span className={cn("text-lg font-medium", item.textColor)}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <ActionButton />
      </CardContent>
    </Card>
  );
};
