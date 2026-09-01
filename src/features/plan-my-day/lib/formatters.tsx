import { Button } from "@/components/ui/button";
import { DailyPlanEnergyLevel } from "@/db/shared";
import { TriageTasksDialog } from "@/features/plan-my-day/components/triage-tasks-dialog";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { TriggerTaskDetailsButton } from "@/features/tasks/components/trigger-task-details-button";
import {
    BatteryFullIcon,
    BatteryLowIcon,
    BatteryMediumIcon,
    FolderInputIcon,
    ListChecksIcon,
    PlayIcon,
    PlusIcon,
    SearchIcon,
    SparklesIcon,
} from "lucide-react";
import { ReactNode } from "react";
import { DailyPlanDialog } from "../components/daily-plan-dialog";
import {
    PlannerCardOutcome,
    TriageQuestionnaireChoice,
    TriageQuestionnaireItem,
    TriageSuggestion,
} from "./types";

export const formatPlannerCardState = ({
  state,
  source,
  taskId,
}: PlannerCardOutcome) => {
  switch (state) {
    case "clear":
      return {
        title: "Your day is clear",
        description:
          "Nothing urgent needs your attention. Enjoy the space, or capture something new when it appears.",
        actionButton: () => (
          <TaskDialog>
            <Button size="lg">
              <PlusIcon />
              Create a task
            </Button>
          </TaskDialog>
        ),
      };
    case "single": {
      let title = "";
      let description = "";
      let buttonIcon: ReactNode | null = null;
      let buttonText = "";
      switch (source) {
        case "today":
          title = "One clear priority";
          description =
            "You already know what deserves your focus. Start with the one task you already committed to today.";
          buttonIcon = <PlayIcon />;
          buttonText = "Start task";
          break;
        case "attention":
          title = "One tasks needs a decision";
          description =
            "Review the overdue task before adding anything else to your day.";
          buttonIcon = <SearchIcon />;
          buttonText = "Review task";
          break;
        case "unsorted":
          title = "One task needs organizing";
          description =
            "Give this task a useful home or date when you are ready. There is no need to generate a full plan.";
          buttonIcon = <FolderInputIcon />;
          buttonText = "Organize task";
          break;
        default:
          throw new Error(`Unknown source: ${source satisfies never}`);
      }
      return {
        title,
        description,
        actionButton: () => (
          <TriggerTaskDetailsButton taskId={taskId} size="lg">
            {buttonIcon}
            {buttonText}
          </TriggerTaskDetailsButton>
        ),
      };
    }
    case "triage":
      return {
        title: "Your task inbox needs a quick cleanup",
        description:
          "You have a few tasks without a clear place or date. Sort a few first, then we can build a plan with better information.",
        actionButton: () => (
          <TriageTasksDialog>
            <Button size="lg">
              <ListChecksIcon />
              Triage my tasks
            </Button>
          </TriageTasksDialog>
        ),
      };
    case "plan_ready":
      return {
        title: "Make today feel manageable",
        description:
          "Let us turn your priorities, deadlines, and available time into a calm plan that you can actually finish.",
        actionButton: () => (
          <DailyPlanDialog>
            <Button size="lg">
              <SparklesIcon />
              Plan my day
            </Button>
          </DailyPlanDialog>
        ),
      };
    default:
      throw new Error(`Unknown state: ${state satisfies never}`);
  }
};

export const formatSuggestionToQuestionnaireItem = (
  suggestion: TriageSuggestion,
): TriageQuestionnaireItem => {
  const choices: TriageQuestionnaireChoice[] = [
    {
      value: "accept",
      label: "Use our suggestion",
      description:
        "Apply the suggested project, dates, priority, and other changes.",
    },
    {
      value: "someday",
      label: "Move to someday",
      description:
        "Keep the task, but remove it from active planning for now.",
    },
  ];

  return {
    definition: {
      name: `task:${suggestion.taskId}`,
      required: false,
      choices: choices.map(({ value }) => ({ value })),
    },
    title: "Where should this task go?",
    description: suggestion.reason,
    choices,
    suggestion,
  };
};

export const formatEnergyLevel = (energyLevel: DailyPlanEnergyLevel) => {
  switch (energyLevel) {
    case "low":
      return {
        label: "Low",
        description: "I have low energy and want to focus on easy tasks.",
        icon: BatteryLowIcon,
        bgColor: "bg-sky-50 dark:bg-sky-950/50",
        bgHoverColor: "hover:bg-sky-100/60 dark:hover:bg-sky-900/40",
        textColor: "text-sky-700 dark:text-sky-300",
      };

    case "medium":
      return {
        label: "Medium",
        description: "I have steady energy and can handle a balanced workload.",
        icon: BatteryMediumIcon,
        bgColor: "bg-amber-50 dark:bg-amber-950/50",
        bgHoverColor: "hover:bg-amber-100/60 dark:hover:bg-amber-900/40",
        textColor: "text-amber-700 dark:text-amber-300",
      };

    case "high":
      return {
        label: "High",
        description:
          "I have lots of energy and want to tackle challenging tasks.",
        icon: BatteryFullIcon,
        bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
        bgHoverColor: "hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40",
        textColor: "text-emerald-700 dark:text-emerald-300",
      };

    default:
      throw new Error(`Unknown energy level: ${energyLevel satisfies never}`);
  }
};
