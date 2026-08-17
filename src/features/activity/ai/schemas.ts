import {
  activityActions,
  activitySources,
  activitySubjects,
} from "@/db/shared";
import { isoDatetimeFormatInstructions } from "@/services/ai/tools/helpers";
import z from "zod";

export const readActivityToolSchema = z.object({
  areaIds: z.array(z.uuid()).default([]).describe("Filter by area IDs."),
  projectIds: z.array(z.uuid()).default([]).describe("Filter by project IDs."),
  subjects: z
    .array(z.enum(activitySubjects))
    .default([])
    .describe("Filter by subject types."),
  actions: z
    .array(z.enum(activityActions))
    .default([])
    .describe("Filter by actions."),
  sources: z
    .array(z.enum(activitySources))
    .default([])
    .describe("Filter by sources."),
  after: z.iso
    .datetime()
    .optional()
    .describe(
      `Filter by activity after a certain date, formatted as: ${isoDatetimeFormatInstructions}`,
    ),
  before: z.iso
    .datetime()
    .optional()
    .describe(
      `Filter by activity before a certain date, formatted as: ${isoDatetimeFormatInstructions}`,
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(25)
    .describe("Limit the results to return."),
});
