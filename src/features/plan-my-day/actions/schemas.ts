import z from "zod";

export const suggestionAnswerSchema = z.enum(["accept", "someday"]);
export type SuggestionAnswerSchemaType = z.infer<typeof suggestionAnswerSchema>;
