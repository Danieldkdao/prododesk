export const modelIds = [
  "openai/gpt-5.6-sol",
  "anthropic/claude-opus-4.8",
  "google/gemini-3.1-pro-preview",
  "x-ai/grok-4.5",
  "deepseek/deepseek-v4-pro",
  "qwen/qwen3.7-plus",
  "z-ai/glm-5.2",
  "minimax/minimax-m3",
  "google/gemini-3.1-flash-lite",
] as const;

export type ModelId = (typeof modelIds)[number];
