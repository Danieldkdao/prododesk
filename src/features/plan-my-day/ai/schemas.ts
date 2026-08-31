import z from "zod";
import {
  nullishTriageSuggestionFieldsSchema,
  triageSuggestionFieldsSchema,
} from "../actions/schemas";

export const triageSuggestionSchema = z
  .object({
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
  })
  .extend(nullishTriageSuggestionFieldsSchema.shape);
export type TriageSuggestionSchemaType = z.infer<typeof triageSuggestionSchema>;
