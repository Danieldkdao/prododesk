import {
  OpenAI,
  Grok,
  Claude,
  Gemini,
  DeepSeek,
  Qwen,
  ZAI,
  Minimax,
  IconType,
} from "@lobehub/icons";
import { ModelId } from "./model-ids";

type LLMModelKind = "fast-cost-efficient" | "most-powerful";

type LLMModel = {
  name: string;
  id: ModelId;
  logo: IconType;
  kind: LLMModelKind;
  logoColor?: string;
};

const models = [
  {
    name: "GPT-5.6 Sol",
    id: "openai/gpt-5.6-sol" as const,
    kind: "most-powerful" as const,
    logo: OpenAI,
    logoColor: OpenAI.colorPrimary,
  },
  {
    name: "Claude Opus 4.8",
    id: "anthropic/claude-opus-4.8" as const,
    kind: "most-powerful" as const,
    logo: Claude,
    logoColor: Claude.colorPrimary,
  },
  {
    name: "Gemini 3.1 Pro Preview",
    id: "google/gemini-3.1-pro-preview" as const,
    kind: "most-powerful" as const,
    logo: Gemini.Color,
  },
  {
    name: "Grok 4.5",
    id: "x-ai/grok-4.5" as const,
    kind: "most-powerful" as const,
    logo: Grok,
    logoColor: Grok.colorPrimary,
  },
  {
    name: "DeepSeek V4 Pro",
    id: "deepseek/deepseek-v4-pro" as const,
    logo: DeepSeek.Color,
    kind: "fast-cost-efficient",
  },
  {
    name: "Qwen 3.7 Plus",
    id: "qwen/qwen3.7-plus" as const,
    logo: Qwen.Color,
    kind: "fast-cost-efficient",
  },
  {
    name: "GLM-5.2",
    id: "z-ai/glm-5.2" as const,
    logo: ZAI,
    kind: "fast-cost-efficient",
  },
  {
    name: "MiniMax M3",
    id: "minimax/minimax-m3" as const,
    logo: Minimax.Color,
    kind: "fast-cost-efficient",
  },
  {
    name: "Gemini 3.1 Flash Lite",
    id: "google/gemini-3.1-flash-lite" as const,
    logo: Gemini.Color,
    kind: "fast-cost-efficient",
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
