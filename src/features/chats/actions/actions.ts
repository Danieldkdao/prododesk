"use server";

import { db } from "@/db/db";
import { ChatTable } from "@/db/schema";
import { readChatHistoryPageDb } from "../server/chat-history";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { UnwrapAsync } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
import { openrouter } from "@/services/ai/models/openrouter";
import { GENERATE_CHAT_NAME_INSTRUCTIONS } from "@/services/ai/prompts";
import { generateText } from "ai";
import { and, count, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { after } from "next/server";
import { getChatIdTag, getUserChatTag } from "../server/cache/chats";
import {
  confirmUserChatOwnership,
  deleteChatDb,
  insertChatDb,
  readChatsDb,
  updateChatDb,
} from "../server/chats";
import {
  chatMessageSchema,
  ChatMessageSchemaType,
  chatSchema,
  ChatSchemaType,
} from "./schemas";

export const createChatAction = async (unsafeData: ChatMessageSchemaType) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { data, success } = chatMessageSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const createdChat = await insertChatDb({ name: "Untitled chat", userId });
    if (!createdChat) throw new Error("Failed to insert chat.");

    after(async () => {
      try {
        const { text } = await generateText({
          model: openrouter("mistralai/ministral-3b-2512"),
          prompt:
            "Generate a fitting name for this new chat based on the user's first message: " +
            data.content,
          instructions: GENERATE_CHAT_NAME_INSTRUCTIONS,
          timeout: { totalMs: 15_000 },
          maxRetries: 0,
        });
        const name = text.trim();
        if (name)
          await updateChatDb(
            createdChat.id,
            { name },
            { onlyIfName: "Untitled chat" },
          );
      } catch (error) {
        console.error("Chat title generation failed:", error);
      }
    });

    return {
      error: false,
      message: "Chat created successfully!",
      chat: createdChat,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

const readCachedChat = async (userId: string, chatId: string) => {
  "use cache";
  cacheTag(getChatIdTag(chatId));

  if (!areValidIds(chatId)) return null;

  const existingChat = await db.query.ChatTable.findFirst({
    where: and(eq(ChatTable.id, chatId), eq(ChatTable.userId, userId)),
  });

  return existingChat ?? null;
};
export const readChatAction = async (userId: string, chatId: string) => {
  const { userId: currentUserId } = await getCurrentUser();
  if (!currentUserId || currentUserId !== userId || !areValidIds(chatId))
    return null;

  const chat = await readCachedChat(currentUserId, chatId);
  if (!chat) return null;

  const history = await readChatHistoryPageDb(chat.id);
  if (!history) return null;

  return { ...chat, ...history };
};
export type ReadChatActionReturnType = UnwrapAsync<typeof readChatAction>;

export const readChatTitleAction = async (chatId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId || !areValidIds(chatId)) return null;
  return (
    (await db.query.ChatTable.findFirst({
      where: and(eq(ChatTable.id, chatId), eq(ChatTable.userId, userId)),
      columns: { name: true },
    })) ?? null
  );
};

const readCachedChats = async (
  userId: string,
  filterOptions: { search?: string | null; page: number },
) => {
  "use cache";
  cacheTag(getUserChatTag(userId));

  const page = filterOptions.page;

  const response = await readChatsDb({ ...filterOptions, userId });
  if (!response) return null;

  const { chats, whereQuery } = response;

  const [totalChats] = await db
    .select({
      count: count(),
    })
    .from(ChatTable)
    .where(whereQuery);

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalChats.count;
  const clientKey = JSON.stringify({
    context: {
      userId,
    },
    filters: {
      search: filterOptions.search,
    },
    results: chats.map(({ id, name, updatedAt }) => ({
      id,
      name,
      updatedAt,
    })),
    hasNextPage,
  });

  return {
    chats,
    metadata: {
      hasPrevPage,
      hasNextPage,
      clientKey,
    },
  };
};
export const readChatsAction = async (
  userId: string,
  filterOptions: { search?: string | null; page: number },
) => {
  const { userId: currentUserId } = await getCurrentUser();
  if (!currentUserId || currentUserId !== userId) return null;

  return readCachedChats(currentUserId, {
    search: filterOptions.search,
    page: filterOptions.page,
  });
};
export type ReadChatsActionReturnType = UnwrapAsync<typeof readChatsAction>;

export const updateChatAction = async (
  chatId: string,
  unsafeData: ChatSchemaType,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingChat = await confirmUserChatOwnership(chatId);
  if (!existingChat) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { data, success } = chatSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const updatedChat = await updateChatDb(existingChat.id, data);
    if (!updatedChat) throw new Error("Failed to update chat.");

    return {
      error: false,
      message: "Chat updated successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const deleteChatAction = async (chatId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingChat = await confirmUserChatOwnership(chatId);
  if (!existingChat) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const deletedChat = await deleteChatDb(existingChat.id);
    if (!deletedChat) throw new Error("Failed to create existing chat.");

    return {
      error: false,
      message: "Chat deleted successfully.",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
