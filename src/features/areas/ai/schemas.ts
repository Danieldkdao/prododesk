import { colors } from "@/db/shared";
import { approvalReasonSchema } from "@/services/ai/tools/helpers";
import z from "zod";

export const readAreasToolSchema = z.object({
  search: z
    .string()
    .trim()
    .min(1, { error: "Please enter a search query." })
    .optional()
    .describe(
      "An optional search query that allows you to search for areas by name or description.",
    ),
  areaIds: z
    .array(z.uuid())
    .default([])
    .describe("An array of area IDs to filter by."),
  includeArchived: z
    .boolean()
    .default(false)
    .describe("Whether the query includes archived areas or not."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50)
    .describe("The number of results to return."),
});

export const createAreaToolSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Please enter an area name." })
    .max(50, { error: "Area name cannot be longer than 50 characters." })
    .describe("The area name."),
  description: z.string().trim().nullish().describe("The area description."),
  icon: z
    .string()
    .trim()
    .max(20)
    .nullish()
    .describe("The area icon, an optional emoji."),
  color: z.enum(colors).describe("The area color required."),
  approvalReason: approvalReasonSchema,
});

export const updateAreaToolSchema = z.object({
  areaId: z.uuid().describe("The ID of the area you would like to update."),
  changes: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { error: "Please enter the area name." })
        .max(50)
        .optional(),
      description: z.string().trim().nullish(),
      icon: z.string().trim().nullish(),
      color: z.enum(colors).optional(),
    })
    .refine((changes) => Object.keys(changes).length > 0)
    .describe(
      "The changes you would like to make, you must make at least one change.",
    ),
  approvalReason: approvalReasonSchema,
});

export const setAreaArchivedToolSchema = z.object({
  areaId: z.uuid().describe("The ID of the area you would like to update."),
  archived: z.boolean().describe("The NEW archived status of the area."),
  approvalReason: approvalReasonSchema,
});

export const deleteAreaToolSchema = z.object({
  areaId: z.uuid().describe("The ID of the area you would like to delete."),
  approvalReason: approvalReasonSchema,
});
