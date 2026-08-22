import z from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(1, { error: "Please enter your name." }),
  description: z.string().trim().optional(),
  email: z.email({ error: "Please enter a valid email address." }),
});
export type ProfileSchemaType = z.infer<typeof profileSchema>;
