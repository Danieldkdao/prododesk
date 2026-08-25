import { db } from "@/db/db";
import { ChatMessageTable, MessagePartTable } from "@/db/schema";
import { ArtifactActivityType } from "@/features/activity/lib/types";
import { insertChatAttachmentDb } from "@/features/chat-attachments/server/chat-attachments";
import {
  findChatMessageDb,
  insertChatMessageDb,
  upsertChatMessageDb,
} from "@/features/chats/server/chat-messages";
import {
  findChatRunDb,
  getRunArtifacts,
  insertChatRunDb,
  updateChatRunDb,
  upsertChatRunDb,
} from "@/features/chats/server/chat-runs";
import { confirmUserChatOwnership } from "@/features/chats/server/chats";
import { insertMessagePartDb } from "@/features/chats/server/message-parts";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { APIError } from "@/lib/errors";
import { areValidIds } from "@/lib/utils";
import { COMPACT_AFTER_TOKENS, estimateTokens } from "@/services/ai/helpers";
import { ModelId } from "@/services/ai/model-ids";
import { openrouter } from "@/services/ai/models/openrouter";
import { CHAT_INSTRUCTIONS } from "@/services/ai/prompts";
import { toolApprovalMap, ToolName } from "@/services/ai/tool-contracts";
import { tools } from "@/services/ai/tools";
import { CustomUIMessage, FileAttachment } from "@/services/ai/types";
import {
  consumeStream,
  createAgentUIStreamResponse,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isToolUIPart,
  pruneMessages,
  ToolLoopAgent,
} from "ai";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  let runId: string | null = null;
  let responseTimeMs = 0;
  let streamedArtifacts: ArtifactActivityType[] = [];

  const data: {
    id: string;
    messages: CustomUIMessage[];
    selectedModel?: ModelId;
    chatId?: string;
    trigger?: "regenerate-message";
    assistantMessageId?: string;
  } = await req.json();

  const { messages, selectedModel, chatId, trigger, assistantMessageId } = data;

  const isRegenerating = trigger === "regenerate-message";

  const latestUserMessage = messages.findLast((msg) => msg.role === "user");

  const { userId } = await getCurrentUser();
  if (!userId) {
    return NextResponse.json(UNAUTHED_ERROR_MESSAGE, { status: 401 });
  }

  if (!selectedModel || !chatId) {
    return NextResponse.json(INVALID_DATA_ERROR_MESSAGE, { status: 400 });
  }

  if (!areValidIds(chatId)) {
    return NextResponse.json(NOT_FOUND_ERROR_MESSAGE, { status: 404 });
  }

  const confirmation = await confirmUserChatOwnership(chatId);
  if (!confirmation) {
    return NextResponse.json(NOT_FOUND_ERROR_MESSAGE, { status: 404 });
  }

  try {
    // todo: maybe implement credit system later?

    if (isRegenerating && !assistantMessageId) {
      throw new APIError(INVALID_DATA_ERROR_MESSAGE, 400);
    }

    if (!latestUserMessage) throw new APIError("No user message", 400);

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
          { tx },
        );

        if (!insertedMessage)
          throw new APIError("Failed to insert user chat message.");

        const insertedPart = await insertMessagePartDb(
          {
            messageId: insertedMessage.id,
            part: {
              type: "text",
              text: latestMessage,
            },
            order: 0,
          },
          { tx },
        );

        if (!insertedPart) throw new APIError("Failed to insert message part.");

        const userFileParts = latestUserMessage.parts.filter(
          (part) => part.type === "file",
        );

        const filteredFileParts = userFileParts.filter(
          (part): part is FileAttachment =>
            part.providerMetadata?.prododesk.storageKey !== undefined,
        );

        if (filteredFileParts.length) {
          const filePartsInsertions = await Promise.all(
            filteredFileParts.map((part) =>
              insertChatAttachmentDb(
                {
                  userId,
                  storageKey: part.providerMetadata.prododesk.storageKey,
                  messageId: insertedMessage.id,
                  fileName: part.filename,
                  fileType: part.mediaType,
                },
                tx,
              ),
            ),
          );
          if (
            filePartsInsertions.filter(Boolean).length !==
            filteredFileParts.length
          ) {
            throw new APIError(
              "Failed to insert one or more file attachments.",
            );
          }
        }
      });
    } else {
      const existingChatRun = await findChatRunDb({
        chatId,
        userMessageClientId: latestUserMessage.id,
      });

      if (!existingChatRun)
        throw new APIError("Failed to find existing chat run.");

      runId = existingChatRun.id;

      switch (existingChatRun.status) {
        case "pending":
        case "streaming":
        case "running-tool":
          throw new APIError("This message is already being processed.", 409);
        case "awaiting-approval":
          runId = existingChatRun.id;
          responseTimeMs = existingChatRun.responseTimeMs;
          break;
        case "completed":
          if (!existingChatRun.assistantMessageId)
            throw new APIError(
              "Completed run does not have assistant message attached.",
            );
          const existingMessage = await findChatMessageDb(
            existingChatRun.assistantMessageId,
          );
          if (!existingMessage)
            throw new APIError(
              "Completed run does not have assistant message attached.",
            );

          if (isRegenerating) break;

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
          break;
        default:
          throw new APIError(
            `Unknown chat run status: ${existingChatRun.status satisfies never}`,
          );
      }
    }

    if (!runId) {
      throw new APIError("Failed to log chat run.");
    }

    const chatAgent = new ToolLoopAgent({
      model: openrouter(selectedModel),
      instructions: CHAT_INSTRUCTIONS(selectedModel),
      temperature: 0.4,
      tools,
      toolsContext: Object.fromEntries(
        Object.entries(toolApprovalMap)
          .filter(([, requiresApproval]) => requiresApproval)
          .map(([toolName]) => [toolName, { runId }]),
      ) as Record<ToolName, { runId: string }>,
      toolApproval: Object.fromEntries(
        Object.entries(toolApprovalMap)
          .filter(([, requiresApproval]) => requiresApproval)
          .map(([toolName]) => [toolName, "user-approval"]),
      ),
      timeout: {
        totalMs: 120_000,
        stepMs: 60_000,
        chunkMs: 30_000,
        toolMs: 15_000,
      },
      prepareStep: ({ messages }) => {
        if (estimateTokens(messages) > COMPACT_AFTER_TOKENS) {
          return {
            messages: pruneMessages({
              messages,
              reasoning: "all",
              toolCalls: "before-last-3-messages",
              emptyMessages: "remove",
            }),
          };
        }
      },
      onToolExecutionEnd: async () => {
        if (runId) {
          await updateChatRunDb(runId, {
            status: "running-tool",
          });
        }
      },
      onStepEnd: async ({ performance }) => {
        responseTimeMs += performance.stepTimeMs;
        if (runId) {
          streamedArtifacts = await getRunArtifacts(runId);
        }
      },
    });

    return createAgentUIStreamResponse({
      agent: chatAgent,
      uiMessages: messages,
      abortSignal: req.signal,
      generateMessageId: () => crypto.randomUUID(),
      messageMetadata: ({ part }) => {
        if (part.type === "finish") {
          return {
            modelId: selectedModel,
            chatId,
            createdAt: new Date(),
            responseTimeMs: Math.round(responseTimeMs),
            responseToClientId: latestUserMessage.id,
            artifacts: streamedArtifacts,
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
        if (!runId || !responseMessage?.id) return;

        const hasPendingApproval = responseMessage.parts.some(
          (part) => isToolUIPart(part) && part.state === "approval-requested",
        );

        const roundedRTM = Math.round(responseTimeMs);

        if (hasPendingApproval) {
          await updateChatRunDb(runId, {
            status: "awaiting-approval",
            responseTimeMs: roundedRTM,
          });

          return;
        }

        await db.transaction(async (tx) => {
          const insertedMessage = await upsertChatMessageDb(
            {
              chatId,
              role: "assistant",
              modelId: selectedModel,
              clientMessageId: assistantMessageId ?? responseMessage.id,
              responseToClientId: latestUserMessage.id,
            },
            { tx },
          );

          if (!insertedMessage)
            throw new APIError("Failed to insert assistant message.");

          await tx
            .delete(MessagePartTable)
            .where(eq(MessagePartTable.messageId, insertedMessage.id));

          if (responseMessage.parts.length > 0) {
            await tx.insert(MessagePartTable).values(
              responseMessage.parts.map((part, order) => ({
                messageId: insertedMessage.id,
                order,
                part,
              })),
            );
          }

          if (runId) {
            await updateChatRunDb(
              runId,
              {
                status: isAborted ? "cancelled" : "completed",
                assistantMessageId: insertedMessage.id,
                finishedAt: isAborted ? null : new Date(),
                responseTimeMs: roundedRTM,
              },
              { tx },
            );
          }
          responseTimeMs = 0;
        });
      },
      consumeSseStream: consumeStream,
    });
  } catch (error) {
    console.error(error);

    let errorMessage: string = GENERAL_ERROR_MESSAGE;
    let status: number = 500;

    errorMessage =
      error instanceof Error ? error.message : GENERAL_ERROR_MESSAGE;
    status = error instanceof APIError ? error.status : 500;

    const response = NextResponse.json(errorMessage, { status });

    const userMessageClientId = latestUserMessage?.id;
    let assistantMessageClientId: string | null = null;

    await db.transaction(async (tx) => {
      if (userMessageClientId) {
        const userMessageId = (
          await upsertChatMessageDb(
            {
              chatId: chatId,
              clientMessageId: userMessageClientId,
              modelId: selectedModel,
              role: "user",
            },
            { tx },
          )
        )?.id;
        if (!userMessageId) return response;

        await insertMessagePartDb(
          {
            messageId: userMessageId,
            order: 0,
            part: {
              type: "text",
              text:
                latestUserMessage?.parts
                  .filter((part) => part.type === "text")
                  .map((part) => part.text)
                  .join(" ") ?? "",
            },
          },
          { tx },
        );

        const existingAssistantResponse =
          await tx.query.ChatMessageTable.findFirst({
            where: and(
              eq(ChatMessageTable.role, "assistant"),
              eq(ChatMessageTable.chatId, chatId),
              eq(ChatMessageTable.responseToClientId, userMessageClientId),
              eq(ChatMessageTable.modelId, selectedModel),
            ),
          });
        if (existingAssistantResponse) {
          assistantMessageClientId = existingAssistantResponse.id;
        } else {
          const insertedChatMessage = await insertChatMessageDb(
            {
              chatId: chatId,
              clientMessageId: crypto.randomUUID(),
              modelId: selectedModel,
              role: "assistant",
              responseToClientId: userMessageClientId,
            },
            { tx },
          );
          assistantMessageClientId = insertedChatMessage?.id ?? null;
        }
      }
      if (runId) {
        await updateChatRunDb(
          runId,
          {
            status: "failed",
            error: errorMessage,
            finishedAt: new Date(),
          },
          { tx },
        );
      }
      if (userMessageClientId) {
        await upsertChatRunDb(
          {
            chatId: chatId,
            userMessageClientId: userMessageClientId,
            assistantMessageId: assistantMessageClientId,
            status: "failed",
            error: errorMessage,
            finishedAt: new Date(),
          },
          { tx },
        );
      }
    });

    return response;
  }
};
