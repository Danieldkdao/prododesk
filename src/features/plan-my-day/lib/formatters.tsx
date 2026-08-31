import { Button } from "@/components/ui/button";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { TriggerTaskDetailsButton } from "@/features/tasks/components/trigger-task-details-button";
import {
  FolderInputIcon,
  ListChecksIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";
import { ReactNode } from "react";
import {
  PlannerCardState,
  SingleTaskSource,
  TriageQuestionnaireChoice,
  TriageQuestionnaireItem,
  TriageSuggestion,
} from "./types";
import { TriageTasksDialog } from "@/features/plan-my-day/components/triage-tasks-dialog";
import { type QuestionnaireItemDefinition } from "@shadcn/react/questionnaire";

export const formatPlannerCardState = ({
  state,
  source,
  taskId,
}: {
  [S in PlannerCardState]: S extends "single"
    ? {
        state: S;
        source: SingleTaskSource;
        taskId: string;
      }
    : {
        state: S;
        source?: never;
        taskId?: never;
      };
}[PlannerCardState]) => {
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
    case "single":
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
          <Button size="lg">
            <SparklesIcon />
            Plan my day
          </Button>
        ),
      };
    default:
      throw new Error(`Unknown state: ${state satisfies never}`);
  }
};

export const formatSuggestionToQuestionnaireItem = (
  suggestion: TriageSuggestion,
): TriageQuestionnaireItem => {
  const clarificationChoices: TriageQuestionnaireChoice[] =
    suggestion.clarification?.choices.map((choice, index) => ({
      value: `clarification:${index}`,
      label: choice,
    })) ?? [];

  const choices: TriageQuestionnaireChoice[] =
    clarificationChoices.length > 0
      ? clarificationChoices
      : [
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
    title: suggestion.clarification?.question ?? "Where should this task go?",
    description: suggestion.clarification
      ? "Choose the answer that best matches what you intended."
      : suggestion.reason,
    choices,
    suggestion,
  };
};
