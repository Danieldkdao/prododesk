import { taskPriorities, taskStatuses } from "@/db/shared";
import {
  isoDatetimeFormatInstructions,
  approvalReasonSchema,
} from "@/services/ai/tools/helpers";
import z from "zod";

export const createTasksToolSchema = z.object({
  tasks: z
    .array(
      z.object({
        name: z
          .string()
          .min(1, {
            error:
              "Please enter a task name that is at least one character in length.",
          })
          .describe("The task name."),
        priority: z.enum(taskPriorities).describe("The task priority level."),
        status: z.enum(taskStatuses).describe("The task status."),
        description: z.string().nullish().describe("The task description."),
        emoji: z.string().nullish().describe("The task emoji."),
        scheduledAt: z.iso
          .datetime()
          .nullish()
          .describe(
            `When this task is scheduled at. Optional. ${isoDatetimeFormatInstructions}`,
          ),
        projectId: z
          .uuid()
          .nullish()
          .describe("The ID of the project associated with this task."),
        dueAt: z.iso
          .datetime()
          .nullish()
          .describe(
            `When this task is due. Optional. ${isoDatetimeFormatInstructions}`,
          ),
      }),
    )
    .min(1, { error: "Please enter at least one task in the array." })
    .describe("The tasks you would like to create."),
  approvalReason: approvalReasonSchema,
});

export const readTasksToolSchema = z
  .object({
    before: z.iso
      .datetime()
      .optional()
      .describe(
        `An optional before filter that allows you get tasks BEFORE or AT a provided datetime. ${isoDatetimeFormatInstructions}`,
      ),
    after: z.iso
      .datetime()
      .optional()
      .describe(
        `An optional after filter that allows you get tasks AFTER or AT a provided datetime. ${isoDatetimeFormatInstructions}`,
      ),
    search: z
      .string()
      .optional()
      .describe(
        "An optional search query that allows you search by project name, task name, or task description.",
      ),
    statuses: z
      .array(z.enum(taskStatuses))
      .describe(
        "An array of task statuses you can pass in to filter the tasks by status. Can be empty.",
      ),
    priorities: z
      .array(z.enum(taskPriorities))
      .describe(
        "An array of priorities that allows you to filter the tasks by priority. It is required but you can just pass in an empty array.",
      ),
    areaIds: z
      .array(z.uuid())
      .default([])
      .describe("Narrow down the search with an array of area IDs."),
    projectIds: z
      .array(z.uuid())
      .default([])
      .describe("Narrow down the search with an array of project IDs."),
  })
  .superRefine((data, ctx) => {
    if (data.after && data.before && data.after <= data.before) {
      ctx.addIssue({
        code: "custom",
        path: ["after", "before"],
        message: "Before date cannot come AFTER the after date.",
      });
    }
  });

export const updateTaskToolSchema = z.object({
  id: z.uuid().describe("The ID of the task that you would like to update."),
  updateFields: z
    .object({
      name: z
        .string()
        .min(1, {
          error:
            "Please enter a task name that is at least one character in length.",
        })
        .describe("The task name."),
      priority: z.enum(taskPriorities).describe("The task priority level."),
      description: z.string().nullish().describe("The task description."),
      status: z.enum(taskStatuses).describe("The task status."),
      emoji: z.string().nullish().describe("The task emoji."),
      scheduledAt: z.iso
        .datetime()
        .nullish()
        .describe(
          `When this task is scheduled at. Optional. ${isoDatetimeFormatInstructions}`,
        ),
      dueAt: z.iso
        .datetime()
        .nullish()
        .describe(
          `When this task is due. Optional. ${isoDatetimeFormatInstructions}`,
        ),
    })
    .describe(
      "The updated version of the task that will replace the old task values.",
    ),
  approvalReason: approvalReasonSchema,
});

export const updateTasksStatusToolSchema = z.object({
  ids: z
    .array(z.uuid())
    .min(1, { error: "Please enter at least one task to update." }),
  newStatus: z
    .enum(taskStatuses)
    .describe(
      "The status ALL of the passed tasks will be updated to. Required.",
    ),
  approvalReason: approvalReasonSchema,
});

export const updateTasksPriorityToolSchema = z.object({
  taskIds: z
    .array(z.uuid())
    .min(1)
    .max(100)
    .describe("The array of task IDs you would like to update."),
  priority: z
    .enum(taskPriorities)
    .describe("The NEW priority that the tasks will be updated to."),
  approvalReason: approvalReasonSchema,
});

export const deleteTaskToolSchema = z.object({
  id: z.uuid().describe("The ID of the task to delete."),
  approvalReason: approvalReasonSchema,
});
