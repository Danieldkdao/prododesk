import { modelIds } from "@/db/shared";
import { UIMessage } from "ai";
import z from "zod";

const metadataSchema = z.object({
  createdAt: z.date(),
  modelId: z.enum(modelIds),
});

type Metadata = z.infer<typeof metadataSchema>;

export type CustomUIMessage = UIMessage<Metadata>;
