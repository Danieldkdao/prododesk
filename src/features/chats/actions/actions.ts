"use server";

import { db } from "@/db/db";
import { ChatMessageTable, ChatTable } from "@/db/schema";
import { MessagePartTable } from "@/db/schemas/message-part";
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
import { and, asc, count, desc, eq, ilike } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { getChatIdTag, getUserChatTag } from "../server/cache/chats";
import {
  confirmChatOwnership,
  deleteChatDb,
  insertChatDb,
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
    const createdChat = await db.transaction(async (tx) => {
      const { text } = await generateText({
        model: openrouter("mistralai/ministral-3b-2512"),
        prompt:
          "Generate a fitting name for this new chat based on the user's first message: " +
          data.content,
        instructions: GENERATE_CHAT_NAME_INSTRUCTIONS,
      });
      if (!text) throw new Error("Failed to generate chat name.");

      const insertedChat = await insertChatDb({ name: text, userId }, tx);
      if (!insertedChat) throw new Error("Failed to insert chat.");

      return insertedChat;
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

export const getChatAction = async (userId: string, chatId: string) => {
  "use cache";
  cacheTag(getChatIdTag(chatId));

  if (!areValidIds(chatId)) return null;

  const existingChat = await db.query.ChatTable.findFirst({
    where: and(eq(ChatTable.id, chatId), eq(ChatTable.userId, userId)),
    with: {
      messages: {
        orderBy: asc(ChatMessageTable.createdAt),
        with: {
          chatRun: true,
          parts: {
            orderBy: asc(MessagePartTable.order),
          },
        },
      },
    },
  });

  return existingChat ?? null;
};
export type GetChatActionReturnType = UnwrapAsync<typeof getChatAction>;

export const getChatsAction = async (
  userId: string,
  filterOptions: { search?: string | null; page: number },
) => {
  "use cache";
  cacheTag(getUserChatTag(userId));

  const { search, page } = filterOptions;

  const offset = (page - 1) * PAGE_SIZE;

  const searchQuery = search?.trim()
    ? ilike(ChatTable.name, `%${search.trim()}%`)
    : undefined;

  const whereQuery = and(eq(ChatTable.userId, userId), searchQuery);

  const chats = await db
    .select()
    .from(ChatTable)
    .where(whereQuery)
    .orderBy(desc(ChatTable.createdAt))
    .offset(offset)
    .limit(PAGE_SIZE);

  const [totalChats] = await db
    .select({
      count: count(),
    })
    .from(ChatTable)
    .where(whereQuery);

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalChats.count;

  return {
    chats,
    metadata: {
      hasPrevPage,
      hasNextPage,
    },
  };
};
export type GetChatsActionReturnType = UnwrapAsync<typeof getChatsAction>;

export const updateChatAction = async (
  chatId: string,
  unsafeData: ChatSchemaType,
) => {
  if (!areValidIds(chatId)) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingChat = await confirmChatOwnership(userId, chatId);
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
      error: true,
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
  if (!areValidIds(chatId)) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingChat = await confirmChatOwnership(userId, chatId);
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
