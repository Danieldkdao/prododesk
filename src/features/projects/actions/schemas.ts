import { colors, projectStatuses } from "@/db/shared";
import z from "zod";

export const projectBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Please enter a project name." })
    .max(100, {
      error: "Project name cannot be longer than 100 characters.",
    }),
  outcome: z.string().nullish(),
  icon: z.string().nullish(),
  status: z.enum(projectStatuses),
  color: z.enum(colors),
  areaId: z.uuid().nullish(),
  isArchived: z.boolean(),
  startAt: z.date().nullish(),
  endAt: z.date().nullish(),
});

const validateProjectDates = (
  data: {
    startAt?: Date | null;
    endAt?: Date | null;
  },
  ctx: z.RefinementCtx,
) => {
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
      message: "End time must be after start time.",
    });
  }
};

export const projectSchema =
  projectBaseSchema.superRefine(validateProjectDates);
export const updateProjectSchema = projectBaseSchema.partial();

export type ProjectSchemaType = z.infer<typeof projectSchema>;
export type UpdateProjectSchemaType = z.infer<typeof updateProjectSchema>;
