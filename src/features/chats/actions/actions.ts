"use server";

import { getCurrentUser } from "@/lib/auth/helpers";
import { chatMessageSchema, ChatMessageSchemaType } from "./schemas";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { db } from "@/db/db";
import { insertChatDb } from "../server/chats";
import { generateText } from "ai";
import { openrouter } from "@/services/ai/models/openrouter";
import { GENERATE_CHAT_NAME_INSTRUCTIONS } from "@/services/ai/prompts";
import { insertChatMessageDb } from "../server/chat-messages";
import { and, asc, desc, eq } from "drizzle-orm";
import { ChatMessageTable, ChatTable } from "@/db/schema";
import { UnwrapAsync } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
import { getChatIdTag, getUserChatTag } from "../server/cache/chats";
import { cacheTag } from "next/cache";

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
      },
    },
  });

  return existingChat ?? null;
};
export type GetChatActionReturnType = UnwrapAsync<typeof getChatAction>;

export const getChatsAction = async (userId: string) => {
  "use cache";
  cacheTag(getUserChatTag(userId));

  const chats = await db
    .select()
    .from(ChatTable)
    .where(eq(ChatTable.userId, userId))
    .orderBy(desc(ChatTable.createdAt));

  return chats;
};
export type GetChatsActionReturnType = UnwrapAsync<typeof getChatsAction>;
