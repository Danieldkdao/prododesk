import { InferUITools, UIMessage } from "ai";
import z from "zod";
import { modelIds } from "./model-ids";
import { tools } from "./tools";
import { chatRunStatuses } from "@/db/shared";
import { activitySelectSchema, artifactSelectSchema } from "@/db/schema";

const metadataSchema = z.object({
  createdAt: z.date().nullish(),
  modelId: z.enum(modelIds).nullish(),
  responseTimeMs: z.number().int().min(1).nullish(),
  runStatus: z.enum(chatRunStatuses).nullish(),
  runError: z.string().nullish(),
  responseToClientId: z.string().nullish(),
  chatId: z.uuid().nullish(),
  artifacts: z
    .array(
      artifactSelectSchema.merge(z.object({ activity: activitySelectSchema })),
    )
    .nullish(),
});

type Metadata = z.infer<typeof metadataSchema>;
export type ChatTools = InferUITools<typeof tools>;
export type ChatDataParts = {
  "chat-sync-required": {
    chatId: string;
  };
};

export type CustomUIMessage = UIMessage<Metadata, ChatDataParts, ChatTools>;
export type MessagePart = CustomUIMessage["parts"][number];
