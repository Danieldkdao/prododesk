import { db } from "@/db/db";
import { MessagePartTable } from "@/db/schema";
import { revalidateChatCache } from "@/features/chats/server/cache/chats";
import {
  findChatMessageDb,
  insertChatMessageDb,
  upsertChatMessageDb,
} from "@/features/chats/server/chat-messages";
import {
  findChatRunDb,
  insertChatRunDb,
  updateChatRunDb,
} from "@/features/chats/server/chat-runs";
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
import {
  createAgentUIStreamResponse,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isToolUIPart,
  ToolLoopAgent,
} from "ai";
import { eq } from "drizzle-orm";
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

  const latestUserMessage = messages.findLast((msg) => msg.role === "user");

  if (!latestUserMessage)
    return NextResponse.json({ error: "No user message." }, { status: 400 });

  let runId: string | null = null;

  try {
    const insertedChatRun = await insertChatRunDb({
      chatId,
      userMessageClientId: latestUserMessage.id,
    });

    if (insertedChatRun) {
      runId = insertedChatRun.id;

      const latestMessage = latestUserMessage.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join(" ");

      await db.transaction(async (tx) => {
        const insertedMessage = await insertChatMessageDb(
          {
            chatId,
            modelId: selectedModel,
            role: "user",
            clientMessageId: latestUserMessage.id,
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
    } else {
      const existingChatRun = await findChatRunDb({
        chatId,
        userMessageClientId: latestUserMessage.id,
      });

      if (!existingChatRun)
        throw new Error("Failed to find existing chat run.");

      runId = existingChatRun.id;

      switch (existingChatRun.status) {
        case "pending":
        case "streaming":
        case "running-tool":
          return Response.json(
            { error: "This message is already being processed." },
            { status: 409 },
          );
        case "awaiting-approval":
          runId = existingChatRun.id;
          break;
        case "completed":
          if (!existingChatRun.assistantMessageId)
            return NextResponse.json(
              {
                error:
                  "Completed run does not have assistant message attached.",
              },
              { status: 500 },
            );
          const existingMessage = await findChatMessageDb(
            existingChatRun.assistantMessageId,
          );
          if (!existingMessage)
            return NextResponse.json(
              {
                error:
                  "Completed run does not have assistant message attached.",
              },
              { status: 500 },
            );

          const clientAlreadyHasResponse = messages.some(
            (msg) => msg.id === existingMessage.clientMessageId,
          );
          if (clientAlreadyHasResponse) {
            return createUIMessageStreamResponse({
              stream: createUIMessageStream<CustomUIMessage>({
                execute() {},
              }),
            });
          }

          const stream = createUIMessageStream<CustomUIMessage>({
            execute({ writer }) {
              writer.write({
                type: "data-chat-sync-required",
                data: {
                  chatId,
                },
                transient: true,
              });
            },
          });

          return createUIMessageStreamResponse({ stream });
        case "cancelled":
        case "failed":
          return NextResponse.json({
            error: "This response already failed. Please try a new message.",
          });
        default:
          throw new Error(
            `Unknown chat run status: ${existingChatRun.status satisfies never}`,
          );
      }
    }

    if (!runId) {
      return NextResponse.json(
        { error: "Failed to log chat run." },
        { status: 500 },
      );
    }

    const chatAgent = new ToolLoopAgent({
      model: openrouter(selectedModel),
      instructions: CHAT_INSTRUCTIONS(selectedModel),
      tools,
      toolsContext: {
        createTasks: {
          runId,
        },
        updateTask: {
          runId,
        },
        deleteTask: {
          runId,
        },
        toggleTasksCompletionStatus: {
          runId,
        },
      },
      toolApproval: {
        createTasks: "user-approval",
        deleteTask: "user-approval",
        updateTask: "user-approval",
        toggleTasksCompletionStatus: "user-approval",
      },
      onToolExecutionEnd: async () => {
        if (runId) {
          await updateChatRunDb(runId, {
            status: "running-tool",
          });
        }
      },
    });

    return createAgentUIStreamResponse({
      agent: chatAgent,
      uiMessages: messages,
      generateMessageId: () => crypto.randomUUID(),
      messageMetadata: ({ part }) => {
        if (part.type === "finish") {
          return {
            modelId: selectedModel,
            createdAt: new Date(),
          };
        }
      },
      onError: (error) => {
        const errorMessage = Error.isError(error)
          ? error.message
          : "Something went wrong during generation. Please try again.";
        return errorMessage;
      },
      onEnd: async ({ responseMessage, isAborted }) => {
        if (isAborted || !runId) return;

        const hasPendingApproval = responseMessage.parts.some(
          (part) => isToolUIPart(part) && part.state === "approval-requested",
        );

        if (hasPendingApproval) {
          await updateChatRunDb(runId, {
            status: "awaiting-approval",
          });

          return;
        }

        await db.transaction(async (tx) => {
          const insertedMessage = await upsertChatMessageDb(
            {
              chatId,
              role: "assistant",
              modelId: selectedModel,
              clientMessageId: responseMessage.id,
            },
            tx,
          );

          await tx
            .delete(MessagePartTable)
            .where(eq(MessagePartTable.messageId, insertedMessage.id));

          await tx.insert(MessagePartTable).values(
            responseMessage.parts.map((part, order) => ({
              messageId: insertedMessage.id,
              order,
              part,
            })),
          );

          if (runId) {
            await updateChatRunDb(
              runId,
              {
                status: "completed",
                assistantMessageId: insertedMessage.id,
                finishedAt: new Date(),
              },
              tx,
            );
          }
        });
      },
    });
  } catch (error) {
    console.error(error);

    const errorMessage = Error.isError(error)
      ? error.message
      : "Something went wrong during generation. Please try again.";

    if (runId) {
      await updateChatRunDb(runId, {
        status: "failed",
        error: errorMessage,
        finishedAt: new Date(),
      });
    }

    return NextResponse.json({ error: GENERAL_ERROR_MESSAGE }, { status: 500 });
  }
};
