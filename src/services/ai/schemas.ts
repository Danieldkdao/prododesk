import { taskPriorities, taskStatuses } from "@/db/shared";
import z from "zod";

export const approvalReasonSchema = z
  .string()
  .trim()
  .min(20, {
    error: "The approval reason must provide meaningful detail.",
  })
  .max(500)
  .describe(
    "A detailed, user-facing explanation of why this action is necessary, exactly what will change, and which tasks will be affected. Never use a vague statement.",
  );

export const searchWebToolSchema = z.object({
  query: z
    .string()
    .min(1)
    .max(400, { error: "Query cannot be longer than 400 characters." })
    .superRefine((query, ctx) => {
      if (query.split(" ").length > 50) {
        ctx.addIssue({
          code: "custom",
          path: ["query"],
          message: "Query cannot be longer than 50 words.",
        });
      }
    })
    .describe("The search query. No more than 400 characters and 50 words."),
});
export const searchWebToolValidationSchema = z.object({
  results: z.array(
    z.object({
      id: z.url(),
      title: z.string(),
      url: z.url(),
      publishedDate: z.string().optional(),
      image: z.string().optional(),
      favicon: z.string().optional(),
    }),
  ),
});

export const scrapeWebpageToolSchema = z.object({
  url: z
    .url()
    .describe(
      "The URL of the webpage you would like to scrape. Must start with 'https://'",
    ),
});
export const scrapeWebpageToolValidationSchema = z.object({
  success: z.boolean(),
  data: z.object({
    markdown: z.string(),
  }),
});

const isoDatetimeFormatInstructions =
  "Strict ISO 8601 string format: YYYY-MM-DDTHH:mm:ssZ (e.g., '2026-07-27T21:44:00Z'). Must include a capital 'T' separator and a trailing 'Z' for UTC timezone.";

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
    search: z.string().nullish(),
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

export const deleteTaskToolSchema = z.object({
  id: z.uuid().describe("The ID of the task that you would like to update."),
  approvalReason: approvalReasonSchema,
});

export const runIdContextSchema = z.object({
  runId: z.uuid(),
});
