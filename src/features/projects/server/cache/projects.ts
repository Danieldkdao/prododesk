import { getIdTag, getUserResourceTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getUserProjectTag = (userId: string) => {
  return getUserResourceTag(userId, "projects");
};

export const getProjectIdTag = (projectId: string) => {
  return getIdTag(projectId, "projects");
};

export const revalidateProjectCache = (userId: string, projectId: string) => {
  revalidateTag(getUserProjectTag(userId), { expire: 0 });
  revalidateTag(getProjectIdTag(projectId), { expire: 0 });
};
