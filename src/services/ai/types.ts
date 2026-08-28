import {
  activitySelectSchema,
  artifactSelectSchema,
  chatAttachmentSelectSchema,
} from "@/db/schema";
import { chatRunStatuses } from "@/db/shared";
import { FileUIPart, InferUITools, UIMessage } from "ai";
import z from "zod";
import { modelIds } from "./model-ids";
import { tools } from "./tools";

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
      artifactSelectSchema.extend(
        z.object({ activity: activitySelectSchema }).shape,
      ),
    )
    .nullish(),
  attachments: z.array(chatAttachmentSelectSchema).nullish(),
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

export type FileAttachment = Omit<FileUIPart, "filename"> & {
  filename: string;
  providerMetadata: {
    prododesk: {
      uploadId: string;
    };
  };
};
