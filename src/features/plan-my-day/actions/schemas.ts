import { dailyPlanEnergyLevels } from "@/db/shared";
import z from "zod";

export const suggestionAnswerSchema = z.enum(["accept", "someday"]);
export type SuggestionAnswerSchemaType = z.infer<typeof suggestionAnswerSchema>;

export const planMyDaySchema = z.object({
  timeAvailable: z
    .number({ error: "Please enter a value between 30 and 1440." })
    .min(30, { error: "Please enter a value of at least 30." })
    .max(1440, { error: "Please enter a value of no more than 1440." })
    .positive({ error: "Please enter a value of at least 30." }),
  energyLevel: z.enum(dailyPlanEnergyLevels),
});
export type PlanMyDaySchemaType = z.infer<typeof planMyDaySchema>;
