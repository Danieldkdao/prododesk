import z from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(1, { error: "Please enter your name." }),
  description: z.string().trim().optional(),
  email: z.email({ error: "Please enter a valid email address." }),
});
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
        .transform((val) => (val === "" ? undefined : val))
        .optional(),
    })
    .superRefine((data, context) => {
      if (hasPasswordAccount && !data.currentPassword) {
        context.addIssue({
          code: "custom",
          path: ["currentPassword"],
          message: "Please enter your current password.",
        });
      }
    });
export type PasswordSchemaType = z.infer<ReturnType<typeof getPasswordSchema>>;
