import z from "zod";
import {
  dailyPlanEnergyLevels,
  taskPriorities,
  taskStatuses,
} from "@/db/shared";
import { isoDatetimeFormatInstructions } from "@/services/ai/tools/helpers";
import { MAX_PLAN_ITEMS } from "../lib/constants";

export const triageSuggestionSchema = z.object({
  suggestedName: z
    .string()
    .nullish()
    .describe("The optional suggested name for this task."),
  suggestedProjectId: z
    .uuid()
    .nullish()
    .describe("The optional project ID associated with this task."),
  suggestedMilestoneId: z
    .uuid()
    .nullish()
    .describe("The optional milestone ID associated with this task."),
  suggestedPriority: z
    .enum(taskPriorities)
    .nullish()
    .describe("The suggested priority for this task."),
  suggestedScheduledAt: z.iso
    .datetime()
    .nullish()
    .describe(
      `The suggested scheduled at date for this task. ${isoDatetimeFormatInstructions}`,
    ),
  suggestedDueAt: z.iso
    .datetime()
    .nullish()
    .describe(
      `The suggested due at date for this task. ${isoDatetimeFormatInstructions}`,
    ),
  suggestedStatus: z
    .enum(taskStatuses)
    .nullish()
    .describe("The suggested status for this task."),
  taskId: z.uuid().describe("The ID of the target task for this suggestion."),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("Your confidence level in making this suggestion."),
  reason: z
    .string()
    .trim()
    .min(1)
    .describe(
      "A 1-2 sentence reason explaining your reasoning behind this suggestion.",
    ),
  clarification: z
    .object({
      question: z
        .string()
        .trim()
        .min(1)
        .describe("The clarification question to ask the user."),
      choices: z
        .array(z.string())
        .min(1)
        .max(4)
        .describe(
          "The choices the user has to answer the clarification question.",
        ),
    })
    .nullish()
    .describe(
      "If you do not have enough context/information, ask for clarification here.",
    ),
});
export type TriageSuggestionSchemaType = z.infer<typeof triageSuggestionSchema>;

export const generatedDailyPlanSchema = z.object({
  summary: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .describe("A brief summary of the generated daily plan."),
  items: z
    .array(
      z.object({
        taskId: z.uuid().describe("The ID of the task in the daily plan."),
        estimatedMinutes: z
          .number()
          .int()
          .positive()
          .min(10)
          .max(480)
          .describe("The estimated time in minutes to complete the task."),
        reason: z
          .string()
          .trim()
          .min(1)
          .max(300)
          .describe(
            "A brief reason explaining why this task was included in the daily plan.",
          ),
      }),
    )
    .max(MAX_PLAN_ITEMS),
});
export const dailyPlanDraftSchema = generatedDailyPlanSchema.extend({
  planDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  availableMinutes: z.number().int().min(30).max(1440),
  energyLevel: z.enum(dailyPlanEnergyLevels),
});

export type DailyPlanDraftSchemaType = z.infer<typeof dailyPlanDraftSchema>;
export type GeneratedDailyPlanSchemaType = z.infer<
  typeof generatedDailyPlanSchema
>;
