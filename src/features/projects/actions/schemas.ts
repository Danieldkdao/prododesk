import { colors, projectStatuses } from "@/db/shared";
import { timeSchema } from "@/lib/schemas";
import z from "zod";

export const projectSchema = z
  .object({
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
    color: z.enum(colors).nullish(),
    areaId: z.uuid().nullish(),
    startAt: z.iso
      .date()
      .transform((val) => (val === "" ? null : val))
      .nullish(),
    endAt: z.iso
      .date()
      .transform((val) => (val === "" ? null : val))
      .nullish(),
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
export type ProjectSchemaType = z.infer<typeof projectSchema>;
