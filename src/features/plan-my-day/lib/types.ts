import {
  MilestoneSelectType,
  ProjectSelectType,
  TaskSelectType,
} from "@/db/schema";
import { TriageSuggestionSchemaType } from "../ai/schemas";
import { QuestionnaireItemDefinition } from "@shadcn/react/questionnaire";

export type PlannerCounts = {
  todayTaskCount: number;
  tasksNeedAttentionCount: number;
  unsortedTaskCount: number;
};

export type PlannerCardState = "clear" | "single" | "triage" | "plan_ready";
export type SingleTaskSource = "today" | "attention" | "unsorted";

export type TriageSuggestion = TriageSuggestionSchemaType & {
  task: TaskSelectType;
  project: ProjectSelectType | null;
  milestone: MilestoneSelectType | null;
};

export type TriageQuestionnaireChoice = {
  value: string;
  label: string;
  description?: string;
};

export type TriageQuestionnaireItem = {
  definition: QuestionnaireItemDefinition;
  title: string;
  description: string;
  choices: TriageQuestionnaireChoice[];
  suggestion: TriageSuggestion;
};
