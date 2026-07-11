import { getIdTag, getUserResourceTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getUserTaskTag = (userId: string) => {
  return getUserResourceTag(userId, "tasks");
};

export const getTaskIdTag = (taskId: string) => {
  return getIdTag(taskId, "tasks");
};

export const revalidateTaskCache = (userId: string, taskId: string) => {
  revalidateTag(getUserTaskTag(userId), { expire: 0 });
  revalidateTag(getTaskIdTag(taskId), { expire: 0 });
};
