import { colors } from "@/db/shared";
import z from "zod";

export const areaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Please enter a name." })
    .max(50, { error: "Name can be no longer than 50 characters." }),
  description: z.string().nullish(),
  icon: z.string().nullish(),
  color: z.enum(colors).nullish(),
});
export type AreaSchemaType = z.infer<typeof areaSchema>;
