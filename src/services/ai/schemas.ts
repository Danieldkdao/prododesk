import z from "zod";

export const toolLimitSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .describe("The maximum number of calls allowed."),
  reserveCall: z
    .function()
    .output(z.boolean())
    .describe(
      "A function that takes an updater function to increment the call count.",
    ),
});
