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
type ChatDataParts = {
  "chat-sync-required": {
    chatId: string;
  };
};

export type CustomUIMessage = UIMessage<Metadata, ChatDataParts, ChatTools>;
