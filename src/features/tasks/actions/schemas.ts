import { taskPriorities } from "@/db/shared";
import { timeSchema } from "@/lib/schemas";
import z from "zod";

const dateRangeSchema = z.object({
  from: z.date(),
  to: z.date().optional(),
});

export const taskSchema = z
  .object({
    name: z.string().min(1, {
      error:
        "Please enter a task name that is at least one character in length.",
    }),
    priority: z.enum(taskPriorities),
    description: z.string().nullish(),
    emoji: z.string().nullish(),
    startAt: timeSchema.transform((val) => (val === "" ? null : val)).nullish(),
    endAt: timeSchema.transform((val) => (val === "" ? null : val)).nullish(),
    range: dateRangeSchema,
  })
  .superRefine((data, ctx) => {
    if (data.endAt && !data.startAt) {
      ctx.addIssue({
        code: "custom",
        path: ["startAt"],
        message: "Start time is required when end time is provided.",
      });
    }

    if (data.startAt && data.endAt && data.startAt >= data.endAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endAt"],
        message: "End time cannot be before start time.",
      });
    }

    if (data.range && data.range.to && data.range.from > data.range.to) {
      ctx.addIssue({
        code: "custom",
        path: ["range"],
        message: "Please select a valid range.",
      });
    }
  });
export type TaskSchemaType = z.infer<typeof taskSchema>;
