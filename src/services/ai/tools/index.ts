import { Tool } from "ai";

import { activityTools } from "@/features/activity/ai/tools";
import { areaTools } from "@/features/areas/ai/tools";
import { documentTools } from "@/features/documents/ai/tools";
import { milestoneTools } from "@/features/milestones/ai/tools";
import { projectTools } from "@/features/projects/ai/tools";
import { taskTools } from "@/features/tasks/ai/tools";
import { webSearchTools } from "@/features/web-search/ai/tools";
import { ToolName } from "../tool-contracts";
import { systemTools } from "./system";
import { settingsTools } from "@/features/settings/ai/tools";

export const tools = {
  ...systemTools,
  ...webSearchTools,
  ...taskTools,
  ...areaTools,
  ...projectTools,
  ...documentTools,
  ...milestoneTools,
  ...activityTools,
  ...settingsTools,
} satisfies Record<ToolName, Tool>;
