import { taskPriorities, taskStatuses } from "@/db/shared";
import z from "zod";

export const taskSchema = z
  .object({
    name: z.string().min(1, {
      error:
        "Please enter a task name that is at least one character in length.",
    }),
    priority: z.enum(taskPriorities),
    description: z.string().nullish(),
    emoji: z.string().nullish(),
    projectId: z.uuid().nullish(),
    status: z.enum(taskStatuses),
    scheduledAt: z.date().nullish(),
    dueAt: z.date().nullish(),
  })
  .superRefine((data, ctx) => {
    if (data.scheduledAt && data.dueAt && data.scheduledAt >= data.dueAt) {
      ctx.addIssue({
        code: "custom",
        path: ["dueAt"],
        message: "Task cannot be due before it is scheduled.",
      });
    }

    const today = new Date();

    if (data.scheduledAt && data.scheduledAt < today) {
      ctx.addIssue({
        code: "custom",
        path: ["scheduledAt"],
        message: "You cannot schedule a task in the past.",
      });
    }

    if (data.dueAt && data.dueAt < today) {
      ctx.addIssue({
        code: "custom",
        path: ["dueAt"],
        message: "Due date cannot be in the past.",
      });
    }
  });
export type TaskSchemaType = z.infer<typeof taskSchema>;
