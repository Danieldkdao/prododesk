import { tool } from "ai";
import { format } from "date-fns";
import z from "zod";

import { taskTools } from "@/features/tasks/ai/tools";
import { webSearchTools } from "@/features/web-search/ai/tools";
import { ChatToolSet, ToolName } from "../tool-contracts";

const getCurrentTimeTool = tool({
  description: "Allows you to get the current system time.",
  inputSchema: z.object({}),
  execute: async () => {
    const date = new Date();
    return format(date, "PPPPpppp");
  },
});

export const tools = {
  ...webSearchTools,
  ...taskTools,
  getCurrentTime: getCurrentTimeTool,
} satisfies ChatToolSet;
export const toolNames = Object.keys(tools) as ToolName[];
