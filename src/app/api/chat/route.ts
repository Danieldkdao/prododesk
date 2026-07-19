import { db } from "@/db/db";
import { revalidateChatCache } from "@/features/chats/server/cache/chats";
import { insertChatMessageDb } from "@/features/chats/server/chat-messages";
import { insertMessagePartDb } from "@/features/chats/server/message-parts";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { ModelId } from "@/services/ai/models";
import { openrouter } from "@/services/ai/models/openrouter";
import { CHAT_INSTRUCTIONS } from "@/services/ai/prompts";
import { MessagePart } from "@/services/ai/tool-contracts";
import { tools } from "@/services/ai/tools";
import { CustomUIMessage } from "@/services/ai/types";
import { createAgentUIStreamResponse, ToolLoopAgent } from "ai";
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
    await db.transaction(async (tx) => {
      const insertedMessage = await insertChatMessageDb(
        {
          chatId,
          modelId: selectedModel,
          role: "user",
        },
        tx,
      );

      if (!insertedMessage)
        throw new Error("Failed to insert user chat message.");

      const insertedPart = await insertMessagePartDb(
        {
          messageId: insertedMessage.id,
          part: {
            type: "text",
            text: latestMessage,
          },
          order: 0,
        },
        tx,
      );

      if (!insertedPart) throw new Error("Failed to insert message part.");

      revalidateChatCache(userId, insertedMessage.chatId);
    });

    const chatAgent = new ToolLoopAgent({
      model: openrouter(selectedModel),
      instructions: CHAT_INSTRUCTIONS(selectedModel),
      tools,
      onEnd: async ({ content }) => {
        console.log(content);
        const contentParts = content.filter(
          (c) =>
            c.type === "text" ||
            c.type === "tool-call" ||
            c.type === "reasoning",
        );
        const toolResultParts = content.filter((c) => c.type === "tool-result");

        await db.transaction(async (tx) => {
          const insertedMessage = await insertChatMessageDb(
            {
              chatId,
              modelId: selectedModel,
              role: "assistant",
            },
            tx,
          );

          if (!insertedMessage)
            throw new Error("Failed to insert AI chat message.");

          let order = 0;

          for (const part of contentParts) {
            order++;
            const storedPart: MessagePart =
              part.type === "text"
                ? {
                    type: "text",
                    text: part.text,
                  }
                : part.type === "reasoning"
                  ? {
                      type: "reasoning",
                      text: part.text,
                    }
                  : {
                      type: "dynamic-tool",
                      toolName: part.toolName,
                      toolCallId: part.toolCallId,
                      state: "output-available",
                      input: part.input,
                      output: toolResultParts.find(
                        (result) => result.toolCallId === part.toolCallId,
                      )?.output,
                    };
            await insertMessagePartDb(
              {
                messageId: insertedMessage.id,
                order,
                part: storedPart,
              },
              tx,
            );
          }

          revalidateChatCache(userId, insertedMessage.chatId);
        });
      },
    });

    return createAgentUIStreamResponse({
      agent: chatAgent,
      uiMessages: messages,
      messageMetadata: ({ part }) => {
        if (part.type === "finish") {
          return {
            modelId: selectedModel,
            createdAt: new Date(),
          };
        }
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: GENERAL_ERROR_MESSAGE }, { status: 500 });
  }
};
