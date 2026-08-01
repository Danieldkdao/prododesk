import z from "zod";

export const documentSchema = z.object({
  name: z.string().optional(),
  content: z.string().optional(),
  projectId: z.uuid().optional(),
});
export type DocumentSchemaType = z.infer<typeof documentSchema>;
