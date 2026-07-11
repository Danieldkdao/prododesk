import z from "zod";

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)$/, {
    error: "Please enter a valid time.",
  });
