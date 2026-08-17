import { milestoneStatuses } from "@/db/shared";
import {
  approvalReasonSchema,
  isoDatetimeFormatInstructions,
} from "@/services/ai/tools/helpers";
import z from "zod";

export const readMilestonesToolSchema = z.object({
  search: z
    .string()
    .trim()
    .optional()
    .describe(
      "An optional search query that allows you to search by milestone name.",
    ),
  milestoneIds: z
    .array(z.uuid())
    .default([])
    .describe("An array of milestone IDs to narrow down the search."),
  projectIds: z
    .array(z.uuid())
    .default([])
    .describe("An array of project IDs to narrow down the search."),
  statuses: z
    .array(z.enum(milestoneStatuses))
    .default([])
    .describe("An array of milestone IDs to narrow down the search."),
  dueBefore: z.iso
    .datetime()
    .optional()
    .describe(
      `Filter by milestones that are due before a certain date, formatted as: ${isoDatetimeFormatInstructions}`,
    ),
  dueAfter: z.iso
    .datetime()
    .optional()
    .describe(
      `Filter by milestones that are due after a certain date, formatted as: ${isoDatetimeFormatInstructions}`,
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50)
    .describe("The maximum number of results to return."),
});

export const createMilestonesToolSchema = z.object({
  milestones: z
    .array(
      z.object({
        projectId: z.uuid().describe("The ID of the associated project."),
        name: z
          .string()
          .trim()
          .min(1, { error: "Please enter a milestone name." })
          .max(100)
          .describe("The milestone name."),
        description: z
          .string()
          .trim()
          .nullish()
          .describe("The milestone description."),
        status: z
          .enum(milestoneStatuses)
          .default("not_started")
          .describe("The milestone status."),
        position: z
          .number()
          .int()
          .positive()
          .min(1)
          .optional()
          .describe(
            "The milestone position. Make sure to search for the milestone count before setting this value to that count + 1.",
          ),
        dueAt: z.iso
          .datetime()
          .nullish()
          .describe(
            `The milestone due date, formatted as: ${isoDatetimeFormatInstructions}`,
          ),
      }),
    )
    .min(1)
    .max(25)
    .describe("The milestones to create."),
  approvalReason: approvalReasonSchema,
});

export const updateMilestoneToolSchema = z.object({
  milestoneId: z.uuid().describe("The ID of the milestone to update."),
  changes: z
    .object({
      projectId: z.uuid().optional().describe("The associated project ID."),
      name: z.string().trim().min(1).max(100).describe("The milestone name."),
      description: z
        .string()
        .trim()
        .nullish()
        .describe("The milestone description."),
      status: z
        .enum(milestoneStatuses)
        .optional()
        .describe("The milestone status."),
      dueAt: z.iso
        .datetime()
        .nullish()
        .describe(
          `The milestone due date, formatted as: ${isoDatetimeFormatInstructions}`,
        ),
    })
    .refine((changes) => Object.keys(changes).length > 0)
    .describe("The changes to make, you must make at least one change."),
  approvalReason: approvalReasonSchema,
});

export const updateMilestonesStatusToolSchema = z.object({
  milestoneIds: z
    .array(z.uuid())
    .min(1)
    .max(100)
    .describe("The IDs of all the milestones to update."),
  status: z
    .enum(milestoneStatuses)
    .describe("The NEW status of the milestones."),
  approvalReason: approvalReasonSchema,
});

export const moveMilestoneToolSchema = z.object({
  milestoneId: z.uuid().describe("The ID of the milestone to move."),
  projectId: z
    .uuid()
    .describe("The ID of the project associated with this milestone."),
  position: z
    .number()
    .int()
    .positive()
    .min(1)
    .describe("The NEW position of the milestone."),
  approvalReason: approvalReasonSchema,
});

export const deleteMilestoneToolSchema = z.object({
  milestoneId: z.uuid().describe("The ID of the milestone to delete."),
  approvalReason: approvalReasonSchema,
});
