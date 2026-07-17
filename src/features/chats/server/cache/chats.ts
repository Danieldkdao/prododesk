import { getIdTag, getUserResourceTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getUserChatTag = (userId: string) => {
  return getUserResourceTag(userId, "chats");
};

export const getChatIdTag = (chatId: string) => {
  return getIdTag(chatId, "chats");
};

export const revalidateChatCache = (userId: string, chatId: string) => {
  revalidateTag(getUserChatTag(userId), { expire: 0 });
  revalidateTag(getChatIdTag(chatId), { expire: 0 });
};
