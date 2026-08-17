import z from "zod";

export const isoDatetimeFormatInstructions =
  "Strict ISO 8601 string format: YYYY-MM-DDTHH:mm:ssZ (e.g., '2026-07-27T21:44:00Z'). Must include a capital 'T' separator and a trailing 'Z' for UTC timezone.";

export const approvalReasonSchema = z
  .string()
  .trim()
  .min(20, {
    error: "The approval reason must provide meaningful detail.",
  })
  .max(500)
  .describe(
    "A detailed, user-facing explanation of why this action is necessary, exactly what will change, and which items will be affected. Never use a vague statement.",
  );

export const runIdContextSchema = z.object({
  runId: z.uuid(),
});
