import { TaskSelectType } from "@/db/schema";

export type BoardProperty = Extract<
  keyof TaskSelectType,
  "status" | "priority"
>;
