import { colors, projectStatuses } from "@/db/shared";
import {
  approvalReasonSchema,
  isoDatetimeFormatInstructions,
} from "@/services/ai/tools/helpers";
import z from "zod";

export const readProjectsToolSchema = z.object({
  search: z
    .string()
    .trim()
    .optional()
    .describe("Search query to search projects by name or outcome."),
  projectIds: z
    .array(z.uuid())
    .default([])
    .describe("An array of project IDs to narrow the search to."),
  areaIds: z
    .array(z.uuid())
    .default([])
    .describe("An array of area IDs to narrow the search to."),
  statuses: z
    .array(z.enum(projectStatuses))
    .default([])
    .describe("An array of project statuses to look for."),
  includeArchived: z
    .boolean()
    .default(false)
    .describe("Whether or not to include archived results."),
  startBefore: z.iso
    .datetime()
    .describe(
      `Return results before a certain date, datetime formattted as: ${isoDatetimeFormatInstructions}`,
    ),
});

export const createProjectToolSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Please enter a project name." })
    .max(100, { error: "The name cannot be longer than 100 characters." })
    .describe("The project name."),
  outcome: z.string().trim().nullish().describe("The project outcome."),
  icon: z
    .string()
    .trim()
    .max(20)
    .nullish()
    .describe("The project icon, optional emoji."),
  color: z.enum(colors).describe("The project color."),
  status: z.enum(projectStatuses).describe("The project status."),
  areaId: z
    .uuid()
    .nullish()
    .describe("The ID of the associated area to this project."),
  startAt: z.iso.datetime(
    `The project start date, formatted as: ${isoDatetimeFormatInstructions}`,
  ),
  endAt: z.iso.datetime(
    `The project end date, formatted as: ${isoDatetimeFormatInstructions}`,
  ),
  approvalReason: approvalReasonSchema,
});

export const updateProjectToolSchema = z.object({
  projectId: z.uuid().describe("The ID of the project you want to update."),
  changes: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { error: "Please enter a project name." })
        .optional()
        .describe("The project name."),
      outcome: z.string().trim().nullish().describe("The project outcome."),
      icon: z
        .string()
        .trim()
        .max(20)
        .nullish()
        .describe("The project icon, optional emoji."),
      color: z.enum(colors).describe("The project color."),
      status: z.enum(projectStatuses).describe("The project status."),
      areaId: z
        .uuid()
        .nullish()
        .describe("The ID of the associated area to this project."),
      startAt: z.iso
        .datetime()
        .nullish()
        .describe(
          `The project start date, formatted as: ${isoDatetimeFormatInstructions}`,
        ),
      endAt: z.iso
        .datetime()
        .nullish()
        .describe(
          `The project end date, formatted as: ${isoDatetimeFormatInstructions}`,
        ),
    })
    .refine((changes) => Object.keys(changes).length > 0)
    .describe(
      "The changes you want to make, you must update at least one field.",
    ),
  approvalReason: approvalReasonSchema,
});

export const setProjectArchivedToolSchema = z.object({
  projectId: z.uuid().describe("The affected project ID."),
  archived: z.boolean().describe("The NEW archived status of the project."),
  approvalReason: approvalReasonSchema,
});

export const deleteProjectToolSchema = z.object({
  projectId: z.uuid().describe("The ID of the project you want to delete."),
  approvalReason: approvalReasonSchema,
});
