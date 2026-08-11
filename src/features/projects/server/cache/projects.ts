import {
  getAreaResourceTag,
  getIdTag,
  getUserResourceTag,
} from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getUserProjectTag = (userId: string) => {
  return getUserResourceTag(userId, "projects");
};

export const getProjectIdTag = (projectId: string) => {
  return getIdTag(projectId, "projects");
};

export const getAreaProjectTag = (areaId: string) => {
  return getAreaResourceTag(areaId, "projects");
};

export const revalidateProjectCache = (
  userId: string,
  projectId: string,
  areaId?: string | null,
) => {
  revalidateTag(getUserProjectTag(userId), { expire: 0 });
  revalidateTag(getProjectIdTag(projectId), { expire: 0 });
  if (areaId) {
    revalidateTag(getAreaProjectTag(areaId), { expire: 0 });
  }
};
