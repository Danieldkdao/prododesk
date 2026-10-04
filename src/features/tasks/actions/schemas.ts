import { taskPriorities, taskStatuses } from "@/db/shared";
import z from "zod";

export const taskBaseSchema = z.object({
  name: z.string().min(1, {
    error: "Please enter a task name that is at least one character in length.",
  }),
  priority: z.enum(taskPriorities),
  description: z.string().nullish(),
  emoji: z.string().nullish(),
  projectId: z.uuid().nullish(),
  milestoneId: z.uuid().nullish(),
  status: z.enum(taskStatuses),
  scheduledAt: z.date().nullish(),
  dueAt: z.date().nullish(),
});

const validateTaskDates = (
  data: {
    scheduledAt?: Date | null;
    dueAt?: Date | null;
  },
  ctx: z.RefinementCtx,
  existingDates?:
    { scheduledAt?: Date | null; dueAt?: Date | null } | undefined,
) => {
  if (data.scheduledAt && data.dueAt && data.scheduledAt >= data.dueAt) {
    ctx.addIssue({
      code: "custom",
      path: ["dueAt"],
      message: "Task cannot be due before it is scheduled.",
    });
  }

  const today = new Date();

  if (
    data.scheduledAt &&
    data.scheduledAt < today &&
    data.scheduledAt.getTime() !== existingDates?.scheduledAt?.getTime()
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["scheduledAt"],
      message: "You cannot schedule a task in the past.",
    });
  }

  if (
    data.dueAt &&
    data.dueAt < today &&
    data.dueAt.getTime() !== existingDates?.dueAt?.getTime()
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["dueAt"],
      message: "Due date cannot be in the past.",
    });
  }
};

export const taskSchema = (existingDates?: {
  scheduledAt?: Date | null;
  dueAt?: Date | null;
}) => {
  return taskBaseSchema.superRefine((data, ctx) =>
    validateTaskDates(data, ctx, existingDates),
  );
};
export const updateTaskSchema = taskBaseSchema.partial();

export type TaskSchemaType = z.infer<ReturnType<typeof taskSchema>>;
export type UpdateTaskSchemaType = z.infer<typeof updateTaskSchema>;
