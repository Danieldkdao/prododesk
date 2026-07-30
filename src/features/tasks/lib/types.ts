import { TaskStatus } from "@/db/shared";

export type TaskFormDefaultValues = {
  day?: Date | null;
  project?: { id: string; name: string; icon?: string | null } | null;
  status?: TaskStatus | null;
};
