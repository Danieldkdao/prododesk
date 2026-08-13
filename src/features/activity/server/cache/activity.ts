import { revalidateAreaCache } from "@/features/areas/server/cache/areas";
import { revalidateProjectCache } from "@/features/projects/server/cache/projects";
import {
  getAreaResourceTag,
  getProjectResourceTag,
  getUserResourceTag,
} from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getUserActivityTag = (userId: string) => {
  return getUserResourceTag(userId, "activity");
};

export const getProjectActivityTag = (projectId: string) => {
  return getProjectResourceTag(projectId, "activity");
};

export const getAreaActivityTag = (areaId: string) => {
  return getAreaResourceTag(areaId, "activity");
};

export const revalidateActivityCache = (
  userId: string,
  projectId?: string | null,
  areaId?: string | null,
) => {
  revalidateTag(getUserActivityTag(userId), { expire: 0 });
  if (projectId) {
    revalidateTag(getProjectActivityTag(projectId), { expire: 0 });
    revalidateProjectCache(userId, projectId, areaId);
  }

  if (areaId) {
    revalidateTag(getAreaActivityTag(areaId), { expire: 0 });
    revalidateAreaCache(userId, areaId);
  }
};
