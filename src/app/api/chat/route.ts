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
import { tools } from "@/services/ai/tools";
import { CustomUIMessage } from "@/services/ai/types";
import { createAgentUIStreamResponse, isToolUIPart, ToolLoopAgent } from "ai";
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

  const userMessage = messages.at(-1);

  try {
    if (userMessage?.role === "user") {
      const latestMessage = userMessage.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");

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
    }

    const chatAgent = new ToolLoopAgent({
      model: openrouter(selectedModel),
      instructions: CHAT_INSTRUCTIONS(selectedModel),
      tools,
      toolApproval: {
        createTasks: "user-approval",
        deleteTask: "user-approval",
        updateTask: "user-approval",
        toggleTasksCompletionStatus: "user-approval",
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
      onEnd: async ({ responseMessage, isAborted }) => {
        if (isAborted) return;

        const hasPendingApproval = responseMessage.parts.some(
          (part) => isToolUIPart(part) && part.state === "approval-requested",
        );

        if (hasPendingApproval) return;

        await db.transaction(async (tx) => {
          const insertedMessage = await insertChatMessageDb(
            { chatId, role: "assistant", modelId: selectedModel },
            tx,
          );

          let order = 0;

          for (const part of responseMessage.parts) {
            if (part.type === "step-start") continue;

            await insertMessagePartDb(
              {
                messageId: insertedMessage.id,
                order,
                part,
              },
              tx,
            );

            order++;
          }
        });
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: GENERAL_ERROR_MESSAGE }, { status: 500 });
  }
};
