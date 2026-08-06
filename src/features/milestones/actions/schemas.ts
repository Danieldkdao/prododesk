import { milestoneStatuses } from "@/db/shared";
import z from "zod";

export const milestoneSchema = z.object({
  name: z.string().trim().min(1, { error: "Please enter a milestone name." }),
  description: z.string().nullish(),
  projectId: z.uuid(),
  status: z.enum(milestoneStatuses),
  dueAt: z.date().nullish(),
});
export type MilestoneSchemaType = z.infer<typeof milestoneSchema>;
