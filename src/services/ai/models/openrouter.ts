import { envServer } from "@/data/env/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openrouter = createOpenRouter({
  apiKey: envServer.HACK_CLUB_AI_API_KEY,
  baseURL: "https://ai.hackclub.com/proxy/v1",
});
