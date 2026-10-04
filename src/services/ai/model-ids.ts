export const modelIds = [
  "openai/gpt-6.1-sol",
  "anthropic/claude-opus-5.5",
  "google/gemini-3.1-pro-preview",
  "x-ai/grok-4.7",
  "deepseek/deepseek-v4.1-flash",
  "qwen/qwen3.8-flash",
  "z-ai/glm-5.3-flash",
  "minimax/minimax-m3",
  "google/gemini-3.1-flash-lite",
] as const;

export type ModelId = (typeof modelIds)[number];
