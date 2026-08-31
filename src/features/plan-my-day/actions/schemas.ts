import { taskPriorities, taskStatuses } from "@/db/shared";
import { nullifyZodSchema } from "@/lib/utils";
import { isoDatetimeFormatInstructions } from "@/services/ai/tools/helpers";
import z from "zod";

export const triageSuggestionFieldsSchema = z.object({
  suggestedName: z
    .string()
    .describe("The optional suggested name for this task."),
  suggestedProjectId: z
    .uuid()
    .describe("The optional project ID associated with this task."),
  suggestedMilestoneId: z
    .uuid()
    .describe("The optional milestone ID associated with this task."),
  suggestedPriority: z
    .enum(taskPriorities)
    .describe("The suggested priority for this task."),
  suggestedScheduledAt: z.iso
    .datetime()
    .describe(
      `The suggested scheduled at date for this task. ${isoDatetimeFormatInstructions}`,
    ),
  suggestedDueAt: z.iso
    .datetime()
    .describe(
      `The suggested due at date for this task. ${isoDatetimeFormatInstructions}`,
    ),
  suggestedStatus: z
    .enum(taskStatuses)
    .describe("The suggested status for this task."),
});
export type TriageSuggestionFieldsSchemaType = z.infer<
  typeof triageSuggestionFieldsSchema
>;

export const nullishTriageSuggestionFieldsSchema = nullifyZodSchema(
  triageSuggestionFieldsSchema,
);
