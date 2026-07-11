import { timeSchema } from "@/lib/schemas";
import { mergeDateTime } from "@/lib/utils";
import z from "zod";

export const taskSchema = z
  .object({
    name: z.string().min(1, {
      error:
        "Please enter a task name that is at least one character in length.",
    }),
    description: z.string().nullish(),
    emoji: z.string().nullish(),
    day: z.date(),
    startAt: timeSchema.nullish(),
    endAt: timeSchema.nullish(),
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
  });
export type TaskSchemaType = z.infer<typeof taskSchema>;
