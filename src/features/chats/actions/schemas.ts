import { modelIds } from "@/db/shared";
import z from "zod";

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1, { error: "Please enter some input." }),
  selectedModel: z.enum(modelIds),
});
export type ChatMessageSchemaType = z.infer<typeof chatMessageSchema>;

export const chatSchema = z.object({
  name: z.string().trim().min(1, { error: "Please enter a name." }),
});
export type ChatSchemaType = z.infer<typeof chatSchema>;
