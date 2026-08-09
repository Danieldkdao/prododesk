import { getProjectResourceTag, getUserResourceTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getUserActivityTag = (userId: string) => {
  return getUserResourceTag(userId, "activity");
};

export const getProjectActivityTag = (projectId: string) => {
  return getProjectResourceTag(projectId, "activity");
};

export const revalidateActivityCache = (
  userId: string,
  projectId: string | null,
) => {
  revalidateTag(getUserActivityTag(userId), { expire: 0 });
  if (projectId) {
    revalidateTag(getProjectActivityTag(projectId), { expire: 0 });
  }
};
