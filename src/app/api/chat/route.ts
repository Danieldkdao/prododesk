import { db } from "@/db/db";
import { ModelId } from "@/db/shared";
import { revalidateChatCache } from "@/features/chats/server/cache/chats";
import { insertChatMessageDb } from "@/features/chats/server/chat-messages";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { openrouter } from "@/services/ai/models/openrouter";
import { CustomUIMessage } from "@/services/ai/types";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return NextResponse.json(
      { error: UNAUTHED_ERROR_MESSAGE },
      { status: 401 },
    );
  }

  // todo: maybe implement credit system later?

  const {
    messages,
    selectedModel,
    chatId,
  }: { messages: CustomUIMessage[]; selectedModel?: ModelId; chatId?: string } =
    await req.json();

  if (!selectedModel || !chatId) {
    return NextResponse.json(
      { error: INVALID_DATA_ERROR_MESSAGE },
      { status: 400 },
    );
  }

  const latestMessage = messages
    .filter((msg) => msg.role === "user")
    .at(-1)
    ?.parts.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  if (!latestMessage)
    return NextResponse.json({ error: "No message found." }, { status: 400 });

  try {
    const stream = await db.transaction(async (tx) => {
      const insertedMessage = await insertChatMessageDb(
        {
          chatId,
          content: latestMessage,
          modelId: selectedModel,
          role: "user",
        },
        tx,
      );

      revalidateChatCache(userId, insertedMessage.chatId);

      if (!insertedMessage)
        throw new Error("Failed to insert user chat message.");

      const result = streamText({
        model: openrouter(selectedModel),
        messages: await convertToModelMessages(messages),
        instructions: `
        You are the assistant currently handling this conversation.
        The active model selected for this response is "${selectedModel}".

        Continue helping with the conversation, but do not copy or repeat previous
        assistant claims about model identity. Do not claim to be a different model.
          `.trim(),
        onEnd: async ({ text }) => {
          const insertedMessage = await insertChatMessageDb({
            chatId,
            content: text,
            modelId: selectedModel,
            role: "assistant",
          });

          if (!insertedMessage)
            throw new Error("Failed to insert AI chat message.");

          revalidateChatCache(userId, insertedMessage.chatId);
        },
      });

      return createUIMessageStreamResponse({
        stream: toUIMessageStream({
          stream: result.stream,
          messageMetadata: ({ part }) => {
            if (part.type === "finish") {
              return {
                modelId: selectedModel,
                createdAt: new Date(),
              };
            }
          },
        }),
      });
    });

    return stream;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: GENERAL_ERROR_MESSAGE }, { status: 500 });
  }
};
