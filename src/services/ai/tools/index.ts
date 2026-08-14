import { Tool, tool } from "ai";
import { format } from "date-fns";
import z from "zod";

import { taskTools } from "@/features/tasks/ai/tools";
import { webSearchTools } from "@/features/web-search/ai/tools";
import { ToolName } from "../tool-contracts";
import { areaTools } from "@/features/areas/ai/tools";

const getCurrentTimeTool = tool({
  description: "Allows you to get the current system time.",
  inputSchema: z.object({}),
  execute: async () => {
    const date = new Date();
    return format(date, "PPPPpppp");
  },
});

export const tools: Record<ToolName, Tool> = {
  ...webSearchTools,
  ...taskTools,
  ...areaTools,
  getCurrentTime: getCurrentTimeTool,
};
