import { revalidateProjectCache } from "@/features/projects/server/cache/projects";
import { getProjectResourceTag, getUserResourceTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getUserMilestoneTag = (userId: string) => {
  return getUserResourceTag(userId, "milestones");
};

export const getProjectMilestoneTag = (projectId: string) => {
  return getProjectResourceTag(projectId, "milestones");
};

export const revalidateMilestoneCache = (
  userId: string,
  projectId: string,
  areaId?: string | null,
) => {
  revalidateTag(getUserMilestoneTag(userId), { expire: 0 });
  revalidateTag(getProjectMilestoneTag(projectId), { expire: 0 });
  revalidateProjectCache(userId, projectId, areaId);
};
