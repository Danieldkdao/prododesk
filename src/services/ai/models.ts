import {
  Claude,
  DeepSeek,
  Gemini,
  Grok,
  IconType,
  Minimax,
  OpenAI,
  Qwen,
  ZAI,
} from "@lobehub/icons";
import { ModelId } from "./model-ids";

type LLMModelKind = "fast-cost-efficient" | "most-powerful";

type LLMModel = {
  name: string;
  id: ModelId;
  logo: IconType;
  kind: LLMModelKind;
  logoColor?: string;
  survivesDarkMode: boolean;
};

const models = [
  {
    name: "GPT-5.6 Sol",
    id: "openai/gpt-5.6-sol" as const,
    kind: "most-powerful" as const,
    logo: OpenAI,
    logoColor: OpenAI.colorPrimary,
    survivesDarkMode: false,
  },
  {
    name: "Claude Opus 5",
    id: "anthropic/claude-opus-5" as const,
    kind: "most-powerful" as const,
    logo: Claude,
    logoColor: Claude.colorPrimary,
    survivesDarkMode: true,
  },
  {
    name: "Gemini 3.1 Pro Preview",
    id: "google/gemini-3.1-pro-preview" as const,
    kind: "most-powerful" as const,
    logo: Gemini.Color,
    survivesDarkMode: true,
  },
  {
    name: "Grok 4.5",
    id: "x-ai/grok-4.5" as const,
    kind: "most-powerful" as const,
    logo: Grok,
    logoColor: Grok.colorPrimary,
    survivesDarkMode: false,
  },
  {
    name: "DeepSeek V4 Flash",
    id: "deepseek/deepseek-v4-flash-0731" as const,
    logo: DeepSeek.Color,
    kind: "fast-cost-efficient",
    survivesDarkMode: true,
  },
  {
    name: "GLM-5.3 Flash",
    id: "z-ai/glm-5.3-flash" as const,
    logo: ZAI,
    kind: "fast-cost-efficient",
    survivesDarkMode: false,
  },
  {
    name: "Qwen 3.8 Flash",
    id: "qwen/qwen3.8-flash" as const,
    logo: Qwen.Color,
    kind: "fast-cost-efficient",
    survivesDarkMode: true,
  },
  {
    name: "MiniMax M3",
    id: "minimax/minimax-m3" as const,
    logo: Minimax.Color,
    kind: "fast-cost-efficient",
    survivesDarkMode: true,
  },
  {
    name: "Gemini 3.1 Flash Lite",
    id: "google/gemini-3.1-flash-lite" as const,
    logo: Gemini.Color,
    kind: "fast-cost-efficient",
    survivesDarkMode: true,
  },
] satisfies LLMModel[];

export const mostPowerfulModels = models.filter(
  (m) => m.kind === "most-powerful",
);
export const fastCostEfficientModels = models.filter(
  (m) => m.kind === "fast-cost-efficient",
);

const getModelInfo = (modelId?: ModelId | null | undefined) => {
  if (!modelId) return null;
  return models.find((model) => model.id === modelId) ?? null;
};

export { getModelInfo, models };
export type { LLMModel };
