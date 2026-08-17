import { Tool, tool } from "ai";
import { format } from "date-fns";
import z from "zod";

import { activityTools } from "@/features/activity/ai/tools";
import { areaTools } from "@/features/areas/ai/tools";
import { documentTools } from "@/features/documents/ai/tools";
import { milestoneTools } from "@/features/milestones/ai/tools";
import { projectTools } from "@/features/projects/ai/tools";
import { taskTools } from "@/features/tasks/ai/tools";
import { webSearchTools } from "@/features/web-search/ai/tools";
import { ToolName } from "../tool-contracts";

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
  ...areaTools,
  ...projectTools,
  ...documentTools,
  ...milestoneTools,
  ...activityTools,
  getCurrentTime: getCurrentTimeTool,
} satisfies Record<ToolName, Tool>;
