import { envServer } from "@/data/env/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openrouter = createOpenRouter({
  apiKey: envServer.OPENROUTER_API_KEY,
});
