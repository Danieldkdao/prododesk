export const modelIds = [
  "openai/gpt-5.6-sol",
  "anthropic/claude-opus-5",
  "google/gemini-3.1-pro-preview",
  "x-ai/grok-4.5",
  "deepseek/deepseek-v4-flash-0731",
  "qwen/qwen3.7-plus",
  "minimax/minimax-m3",
  "google/gemini-3.1-flash-lite",
] as const;

export type ModelId = (typeof modelIds)[number];
