import { taskPriorities } from "@/db/shared";
import { aiTimeSchema, timeSchema } from "@/lib/schemas";
import { parse } from "date-fns";
import z from "zod";

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
        description: z.string().nullish().describe("The task description."),
        emoji: z.string().nullish().describe("The task emoji."),
        startAt: aiTimeSchema
          .transform((val) => (val === "" ? null : val))
          .nullish()
          .describe("Start time in HH:mm:ss format, for example 09:30:00."),
        endAt: aiTimeSchema
          .transform((val) => (val === "" ? null : val))
          .nullish()
          .describe("End time in HH:mm:ss format, for example 09:30:00."),
        range: z.object({
          from: z.iso.date(),
          to: z.iso.date().optional(),
        }),
      }),
    )
    .min(1, { error: "Please enter at least one task in the array." })
    .describe("The tasks you would like to create."),
});

export const readTasksToolSchema = z
  .object({
    day: z.iso
      .date()
      .optional()
      .describe(
        "An optional day filter that allows you to filter down and get the tasks on a specific day.",
      ),
    search: z.string().nullish(),
    priorities: z
      .array(z.enum(taskPriorities))
      .describe(
        "An array of priorities that allows you to filter the tasks by priority. It is required but you can just pass in an empty array.",
      ),
  })
  .superRefine((data, ctx) => {
    try {
      if (data.day) {
        void parse(data.day, "yyyy-MM-dd", new Date());
      }
    } catch (error) {
      console.error(error);
      ctx.addIssue({
        code: "custom",
        path: ["date"],
        message: "Invalid date. Please enter a date in the format yyyy-MM-dd.",
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
      emoji: z.string().nullish().describe("The task emoji."),
      startAt: timeSchema
        .transform((val) => (val === "" ? null : val))
        .nullish()
        .describe("The task start time."),
      endAt: timeSchema
        .transform((val) => (val === "" ? null : val))
        .nullish()
        .describe("The task end time."),
      rangeFrom: z.iso.date().describe("The day the task is set on."),
    })
    .describe(
      "The updated version of the task that will replace the old task values.",
    ),
});

export const toggleTasksCompletionStatusToolSchema = z.object({
  ids: z
    .array(z.uuid())
    .min(1, { error: "Please enter at least one task to update." }),
});

export const deleteTaskToolSchema = z.object({
  id: z.uuid().describe("The ID of the task that you would like to update."),
});
