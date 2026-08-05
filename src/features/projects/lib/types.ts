import { TaskSelectType } from "@/db/schema";

export type BoardProperty = Extract<
  keyof TaskSelectType,
  "status" | "priority"
>;
export type ProjectFormDefaultValues = {
  area?: { name: string; icon?: string | null } | null;
};
