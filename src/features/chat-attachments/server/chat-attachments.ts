import { db, DbTransaction } from "@/db/db";
import { ChatAttachmentInsertType, ChatAttachmentTable } from "@/db/schema";
import { revalidateChatCache } from "@/features/chats/server/cache/chats";
import { findChatMessageDb } from "@/features/chats/server/chat-messages";
import { confirmUserChatOwnership } from "@/features/chats/server/chats";
import { getCurrentUser } from "@/lib/auth/helpers";

export const insertChatAttachmentDb = async (
  chatAttachment: ChatAttachmentInsertType,
  tx?: DbTransaction,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const existingChatMessage = await findChatMessageDb(
    chatAttachment.messageId,
    tx,
  );
  if (!existingChatMessage) return null;

  const existingChat = await confirmUserChatOwnership(
    existingChatMessage.chatId,
    undefined,
    tx,
  );
  if (!existingChat) return null;

  const [insertedChatAttachment] = await (tx ?? db)
    .insert(ChatAttachmentTable)
    .values(chatAttachment)
    .returning();

  revalidateChatCache(existingChat.userId, existingChat.id);

  return insertedChatAttachment ?? null;
};
