import { modelIds } from "@/db/shared";
import z from "zod";

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1, { error: "Please enter some input." }),
  selectedModel: z.enum(modelIds),
});
export type ChatMessageSchemaType = z.infer<typeof chatMessageSchema>;
