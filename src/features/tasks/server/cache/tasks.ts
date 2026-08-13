import { revalidateProjectCache } from "@/features/projects/server/cache/projects";
import { getIdTag, getUserResourceTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getUserTaskTag = (userId: string) => {
  return getUserResourceTag(userId, "tasks");
};

export const getTaskIdTag = (taskId: string) => {
  return getIdTag(taskId, "tasks");
};

export const revalidateTaskCache = (
  userId: string,
  taskId: string,
  projectId?: string | null,
  areaId?: string | null,
) => {
  revalidateTag(getUserTaskTag(userId), { expire: 0 });
  revalidateTag(getTaskIdTag(taskId), { expire: 0 });
  if (projectId) {
    revalidateProjectCache(userId, projectId, areaId);
  }
};
