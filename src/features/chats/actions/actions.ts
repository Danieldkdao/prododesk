"use server";

import { db } from "@/db/db";
import {
  ActivityTable,
  ArtifactTable,
  ChatMessageTable,
  ChatTable,
} from "@/db/schema";
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
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { cacheTag } from "next/cache";
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
    const createdChat = await db.transaction(async (tx) => {
      const { text } = await generateText({
        model: openrouter("mistralai/ministral-3b-2512"),
        prompt:
          "Generate a fitting name for this new chat based on the user's first message: " +
          data.content,
        instructions: GENERATE_CHAT_NAME_INSTRUCTIONS,
      });
      if (!text) throw new Error("Failed to generate chat name.");

      const insertedChat = await insertChatDb({ name: text, userId }, { tx });
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

export const readChatAction = async (userId: string, chatId: string) => {
  "use cache";
  cacheTag(getChatIdTag(chatId));

  if (!areValidIds(chatId)) return null;

  const existingChat = await db.query.ChatTable.findFirst({
    where: and(eq(ChatTable.id, chatId), eq(ChatTable.userId, userId)),
    with: {
      messages: {
        orderBy: [asc(ChatMessageTable.createdAt), asc(ChatMessageTable.id)],
        with: {
          attachments: true,
          chatRun: {
            with: {
              artifacts: {
                where: inArray(
                  ArtifactTable.activityId,
                  db
                    .select({ id: ActivityTable.id })
                    .from(ActivityTable)
                    .where(
                      and(
                        eq(ActivityTable.source, "ai"),
                        inArray(ActivityTable.action, ["create", "update"]),
                      ),
                    ),
                ),
                with: {
                  activity: true,
                },
              },
            },
          },
          parts: {
            orderBy: [asc(MessagePartTable.order), asc(MessagePartTable.id)],
          },
        },
      },
    },
  });

  return existingChat ?? null;
};
export type ReadChatActionReturnType = UnwrapAsync<typeof readChatAction>;

export const readChatsAction = async (
  userId: string,
  filterOptions: { search?: string | null; page: number },
) => {
  "use cache";
  cacheTag(getUserChatTag(userId));

  const page = filterOptions.page;

  const response = await readChatsDb({ userId, ...filterOptions });
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
export type ReadChatsActionReturnType = UnwrapAsync<typeof readChatsAction>;

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
