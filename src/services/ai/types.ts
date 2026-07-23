import { InferUITools, UIMessage } from "ai";
import z from "zod";
import { modelIds } from "./model-ids";
import { tools } from "./tools";
import { chatRunStatuses } from "@/db/shared";

const metadataSchema = z.object({
  createdAt: z.date().nullish(),
  modelId: z.enum(modelIds).nullish(),
  responseTimeMs: z.number().int().min(1).nullish(),
  runStatus: z.enum(chatRunStatuses).nullish(),
  runError: z.string().nullish(),
  responseToClientId: z.string().nullish(),
  chatId: z.uuid().nullish(),
});

type Metadata = z.infer<typeof metadataSchema>;
type ChatTools = InferUITools<typeof tools>;
export type ChatDataParts = {
  "chat-sync-required": {
    chatId: string;
  };
};

export type CustomUIMessage = UIMessage<Metadata, ChatDataParts, ChatTools>;
