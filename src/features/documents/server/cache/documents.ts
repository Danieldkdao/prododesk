import { revalidateAreaCache } from "@/features/areas/server/cache/areas";
import { revalidateProjectCache } from "@/features/projects/server/cache/projects";
import { getIdTag, getUserResourceTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getUserDocumentTag = (userId: string) => {
  return getUserResourceTag(userId, "documents");
};

export const getDocumentIdTag = (id: string) => {
  return getIdTag(id, "documents");
};

export const revalidateDocumentCache = (
  userId: string,
  id: string,
  projectId?: string | null,
  areaId?: string | null,
) => {
  revalidateTag(getUserDocumentTag(userId), { expire: 0 });
  revalidateTag(getDocumentIdTag(id), { expire: 0 });
  if (projectId) {
    revalidateProjectCache(userId, projectId);
  }
  if (areaId) {
    revalidateAreaCache(userId, areaId);
  }
};
