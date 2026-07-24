import { getIdTag, getUserResourceTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getUserAreaTag = (userId: string) => {
  return getUserResourceTag(userId, "areas");
};

export const getAreaIdTag = (areaId: string) => {
  return getIdTag(areaId, "areas");
};

export const revalidateAreaCache = (userId: string, areaId: string) => {
  revalidateTag(getUserAreaTag(userId), { expire: 0 });
  revalidateTag(getAreaIdTag(areaId), { expire: 0 });
};
