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
  model: string;
  description: string;
  logo: SimpleIcon;
};

const models = [
  {
    name: "DeepSeek V4 Pro",
    model: "deepseek/deepseek-v4-pro",
    description: "Best for complex reasoning and demanding workflows.",
    logo: siDeepseek,
  },
  {
    name: "Qwen 3.6 35B A3B",
    model: "qwen/qwen3.6-35b-a3b",
    description: "Best for fast multimodal tasks and tool use.",
    logo: siQwen,
  },
  {
    name: "GLM-5.2",
    model: "z-ai/glm-5.2",
    description: "Best for long-running agents and automation.",
    logo: siZdotai,
  },
  {
    name: "MiniMax M3",
    model: "minimax/minimax-m3",
    description: "Best for large-context and multimodal workflows.",
    logo: siMinimax,
  },
  {
    name: "Gemma 4 31B Instruct",
    model: "google/gemma-4-31b-it:free",
    description: "Best option for everyday tasks.",
    logo: siGooglegemini,
  },
  {
    name: "MiniMax M2.7",
    model: "minimax/minimax-m2.7",
    description: "Best for productivity, documents, and coding.",
    logo: siMinimax,
  },
] satisfies LLMModel[];

export { models };
