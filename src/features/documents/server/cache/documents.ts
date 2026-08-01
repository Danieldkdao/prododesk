import { getIdTag, getUserResourceTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getUserDocumentTag = (userId: string) => {
  return getUserResourceTag(userId, "documents");
};

export const getDocumentIdTag = (id: string) => {
  return getIdTag(id, "documents");
};

export const revalidateDocumentCache = (userId: string, id: string) => {
  revalidateTag(getUserDocumentTag(userId), { expire: 0 });
  revalidateTag(getDocumentIdTag(id), { expire: 0 });
};
