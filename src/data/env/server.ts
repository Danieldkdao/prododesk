import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const envServer = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
  },
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: true,
});
