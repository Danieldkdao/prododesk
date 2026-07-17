import { ModelId } from "@/db/shared";
import {
  siDeepseek,
  siGooglegemini,
  siMinimax,
  siQwen,
  siZdotai,
  SimpleIcon,
} from "simple-icons";

export type LLMModel = {
  name: string;
  id: ModelId;
  description: string;
  logo: SimpleIcon;
};

const models = [
  {
    name: "DeepSeek V4 Pro",
    id: "deepseek/deepseek-v4-pro",
    description: "Best for complex reasoning and demanding workflows.",
    logo: siDeepseek,
  },
  {
    name: "Qwen 3.6 35B A3B",
    id: "qwen/qwen3.6-35b-a3b",
    description: "Best for fast multimodal tasks and tool use.",
    logo: siQwen,
  },
  {
    name: "GLM-5.2",
    id: "z-ai/glm-5.2",
    description: "Best for long-running agents and automation.",
    logo: siZdotai,
  },
  {
    name: "MiniMax M3",
    id: "minimax/minimax-m3",
    description: "Best for large-context and multimodal workflows.",
    logo: siMinimax,
  },
  {
    name: "Gemini 3.1 Flash Lite",
    id: "google/gemini-3.1-flash-lite",
    description: "Best for fast, affordable multimodal tasks.",
    logo: siGooglegemini,
  },
] satisfies LLMModel[];

const getModelInfo = (modelId?: ModelId | null | undefined) => {
  if (!modelId) return null;
  return models.find((model) => model.id === modelId) ?? null;
};

export { models, getModelInfo };
