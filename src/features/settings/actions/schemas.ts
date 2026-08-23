import z from "zod";

const baseSettingsSchema = z.object({
  description: z.string().trim().optional(),
});

const handleSettingsRefinements = (
  data: z.infer<typeof baseSettingsSchema>,
  ctx: z.RefinementCtx,
) => {
  if (data.description && data.description.length > 500) {
    ctx.addIssue({
      code: "custom",
      path: ["description"],
      message: "Description must be less than 500 characters.",
    });
  }
};

export const settingsSchema = baseSettingsSchema.superRefine(
  handleSettingsRefinements,
);
export type SettingsSchemaType = z.infer<typeof settingsSchema>;

export const profileSchema = z
  .object({
    name: z.string().trim().min(1, { error: "Please enter your name." }),
    email: z.email({ error: "Please enter a valid email address." }),
  })
  .extend(baseSettingsSchema.shape)
  .superRefine(handleSettingsRefinements);

export type ProfileSchemaType = z.infer<typeof profileSchema>;

export const getPasswordSchema = (hasPasswordAccount: boolean) =>
  z
    .object({
      currentPassword: z.string().trim().optional(),
      newPassword: z
        .string()
        .trim()
        .min(8, {
          error: "Please enter a new password with at least 8 characters.",
        })
        .max(128, { error: "Password must be less than 128 characters." })
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (hasPasswordAccount && !data.currentPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["currentPassword"],
          message: "Please enter your current password.",
        });
      }
      if (hasPasswordAccount && !data.newPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["newPassword"],
          message: "Please enter a new password.",
        });
      }
      if (
        hasPasswordAccount &&
        data.newPassword &&
        (data.newPassword.length < 8 || data.newPassword.length > 128)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["newPassword"],
          message: "New password must be between 8 and 128 characters long.",
        });
      }
      if (hasPasswordAccount && data.newPassword === data.currentPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["newPassword"],
          message: "New password must be different from the current password.",
        });
      }
    });
export type PasswordSchemaType = z.infer<ReturnType<typeof getPasswordSchema>>;
