import z from "zod";

export const suggestionAnswerSchema = z.enum(["accept", "someday"]);
export type SuggestionAnswerSchemaType = z.infer<typeof suggestionAnswerSchema>;

export const planMyDaySchema = z.object({
  timeAvailable: z
    .number()
    .min(30, { error: "Please enter a value of at least 30." })
    .positive({ error: "Please enter a value of at least 30." }),
});
