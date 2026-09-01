import { ErrorState } from "@/components/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertCircleIcon, CalendarCheckIcon, InboxIcon } from "lucide-react";
import { Suspense } from "react";
import { readDayPlanAction, readPlanMyDayDataAction } from "../actions/actions";
import { formatPlannerCardState } from "../lib/formatters";
import { ExistingDayPlanCard } from "./existing-day-plan-card";

export const PlanMyDayCard = () => {
  return (
    <Suspense fallback={<PlanMyDayCardLoading />}>
      <PlanMyDayCardSuspense />
    </Suspense>
  );
};

const PlanMyDayCardLoading = () => {
  return <div>loading</div>;
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
