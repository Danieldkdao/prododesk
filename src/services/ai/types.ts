import { InferUITools, UIMessage } from "ai";
import z from "zod";
import { modelIds } from "./models";
import { tools } from "./tools";

const metadataSchema = z.object({
  createdAt: z.date(),
  modelId: z.enum(modelIds),
});

type Metadata = z.infer<typeof metadataSchema>;
type ChatTools = InferUITools<typeof tools>;

export type CustomUIMessage = UIMessage<
  Metadata,
  Record<string, never>,
  ChatTools
>;
