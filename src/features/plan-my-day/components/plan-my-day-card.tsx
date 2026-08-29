import { Suspense } from "react";
import { readPlanMyDayDataAction } from "../actions/actions";
import { ErrorState } from "@/components/error-state";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircleIcon,
  CalendarCheckIcon,
  InboxIcon,
  SparklesIcon,
  WandSparklesIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

  return (
    <Card className="py-4 border-2 border-primary/60 bg-linear-to-br from-primary/5 to-card">
      <CardContent className="flex items-center gap-x-8 gap-y-4 px-4 justify-between flex-wrap">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <WandSparklesIcon className="text-primary size-5" />
            <span className="text-lg font-semibold text-primary">
              Your daily guide
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-2xl font-semibold">
              Make today feel manageable
            </h2>
            <p className="text-lg text-muted-foreground font-medium max-w-150">
              ProdoDesk can turn your priorities, deadlines, and available time
              into a calm plan you can actually finish.
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
        <Button size="lg">
          <SparklesIcon />
          Plan my day
        </Button>
      </CardContent>
    </Card>
  );
};
