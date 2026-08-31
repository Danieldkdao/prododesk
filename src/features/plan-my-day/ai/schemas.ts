import { taskPriorities, taskStatuses } from "@/db/shared";
import { isoDatetimeFormatInstructions } from "@/services/ai/tools/helpers";
import z from "zod";

export const triageSuggestionSchema = z.object({
  taskId: z.uuid().describe("The ID of the target task for this suggestion."),
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
