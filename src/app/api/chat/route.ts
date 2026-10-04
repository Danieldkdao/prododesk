import { DbTransaction } from "@/db/db";
import { ChatMessageTable, MessagePartTable } from "@/db/schema";
import { ArtifactActivityType } from "@/features/activity/lib/types";
import { insertChatAttachmentDb } from "@/features/chat-attachments/server/chat-attachments";
import { CHAT_GENERATION_TIMEOUT_MS } from "@/features/chats/lib/run-attempt";
import {
  findChatMessageDb,
  insertChatMessageDb,
  upsertChatMessageDb,
} from "@/features/chats/server/chat-messages";
import {
  claimChatRunDb,
  findChatRunDb,
  getRunArtifacts,
  insertChatRunDb,
  updateChatRunDb,
  withChatRunAttemptDb,
} from "@/features/chats/server/chat-runs";
import { confirmUserChatOwnership } from "@/features/chats/server/chats";
import { insertMessagePartDb } from "@/features/chats/server/message-parts";
import {
  confirmUserUploadIntentOwnership,
  deleteUploadIntentDb,
} from "@/features/uploads/server/uploads";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { APIError } from "@/lib/errors";
import { areValidIds, isError } from "@/lib/utils";
import { guardToolExecutions } from "@/services/ai/guard-tool-executions";
import { COMPACT_AFTER_TOKENS, estimateTokens } from "@/services/ai/helpers";
import { ModelId } from "@/services/ai/model-ids";
import { openrouter } from "@/services/ai/models/openrouter";
import { CHAT_INSTRUCTIONS } from "@/services/ai/prompts";
import { toolContextMap, ToolName } from "@/services/ai/tool-contracts";
import { tools } from "@/services/ai/tools";
import { CustomUIMessage, FileAttachment } from "@/services/ai/types";
import {
  consumeStream,
  createAgentUIStreamResponse,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isToolUIPart,
  pruneMessages,
  TextStreamPart,
  ToolLoopAgent,
} from "ai";
import { and, count, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  let runId: string | null = null;
  let responseTimeMs = 0;
  let streamedArtifacts: ArtifactActivityType[] = [];
  let generationError: string | null = null;
  let attemptStartedAt: Date | null = null;

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
      const claim = await claimChatRunDb(
        { ...insertedChatRun, chat: confirmation },
        { isNew: true, isRegenerating },
      );
      if (!claim?.startedAt)
        return NextResponse.json("This message is already being processed.", {
          status: 409,
        });
      attemptStartedAt = claim.startedAt;

      const latestMessage = latestUserMessage.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join(" ");

      const persisted = await withChatRunAttemptDb(
        runId,
        attemptStartedAt,
        async (tx) => {
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

          if (!insertedPart)
            throw new APIError("Failed to insert message part.");

          const userFileParts = latestUserMessage.parts.filter(
            (part): part is FileAttachment =>
              part.type === "file" &&
              Boolean(part.providerMetadata?.prododesk.uploadId),
          );
          const uploadIds = userFileParts.map(
            (part) => part.providerMetadata.prododesk.uploadId,
          );
          if (!areValidIds(uploadIds))
            throw new APIError(
              "One or more file attachments are invalid.",
              400,
            );

          const existingUploadIntents = (
            await Promise.all(
              userFileParts.map((part) =>
                confirmUserUploadIntentOwnership(
                  part.providerMetadata.prododesk.uploadId,
                ).then((intent) => (intent ? { ...intent, part } : null)),
              ),
            )
          ).filter((intent): intent is NonNullable<typeof intent> =>
            Boolean(intent),
          );

          if (existingUploadIntents.length !== userFileParts.length)
            throw new APIError(
              "One or more file attachments are invalid.",
              400,
            );

          if (existingUploadIntents.length) {
            const filePartsInsertions = await Promise.all(
              existingUploadIntents.map((intent) =>
                insertChatAttachmentDb(
                  {
                    userId,
                    storageKey: intent.storageKey,
                    messageId: insertedMessage.id,
                    fileName: intent.part.filename,
                    fileType: intent.part.mediaType,
                  },
                  tx,
                ),
              ),
            );
            if (
              filePartsInsertions.filter(Boolean).length !==
              existingUploadIntents.length
            ) {
              throw new APIError(
                "Failed to insert one or more file attachments.",
              );
            }
            const deletedUploadIntents = await Promise.all(
              existingUploadIntents.map((intent) =>
                deleteUploadIntentDb(intent.id, tx),
              ),
            );
            if (
              deletedUploadIntents.filter(Boolean).length !==
              existingUploadIntents.length
            )
              throw new APIError("Failed to delete one or more uploads.");
          }
        },
      );
      if (!persisted)
        return NextResponse.json("This chat attempt is no longer active.", {
          status: 409,
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
          break;
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
      const claim = await claimChatRunDb(existingChatRun, {
        isNew: false,
        isRegenerating,
      });
      if (!claim?.startedAt)
        return NextResponse.json("This message is already being processed.", {
          status: 409,
        });
      attemptStartedAt = claim.startedAt;
    }

    if (!runId || !attemptStartedAt) {
      throw new APIError("Failed to log chat run.");
    }

    let webSearchToolCount = 0;
    let scrapeWebpageToolCount = 0;

    const ownedRunId = runId;
    const ownedAttemptStartedAt = attemptStartedAt;
    const remainingGenerationMs = Math.max(
      1,
      CHAT_GENERATION_TIMEOUT_MS - (Date.now() - attemptStartedAt.getTime()),
    );
    const attemptSignal = AbortSignal.any([
      req.signal,
      AbortSignal.timeout(remainingGenerationMs),
    ]);
    const attemptTools = guardToolExecutions(
      tools,
      (name) => toolContextMap[name as ToolName].requiresApproval,
      async (execute) => {
        const owned = await withChatRunAttemptDb(
          ownedRunId,
          ownedAttemptStartedAt,
          async () => execute(),
        );
        if (!owned)
          throw new APIError("This chat attempt is no longer active.", 409);
        return owned.value;
      },
    );
    const chatAgent = new ToolLoopAgent({
      model: openrouter(selectedModel),
      instructions: CHAT_INSTRUCTIONS(selectedModel),
      temperature: 0.4,
      tools: attemptTools,
      toolsContext: {
        searchWeb: {
          limit: 2,
          reserveCall() {
            if (webSearchToolCount >= this.limit) {
              return false;
            }

            webSearchToolCount++;
            return true;
          },
        },
        scrapeWebpage: {
          limit: 2,
          reserveCall() {
            if (scrapeWebpageToolCount >= this.limit) {
              return false;
            }

            scrapeWebpageToolCount++;
            return true;
          },
        },
        createTasks: {
          runId,
        },
        updateTask: {
          runId,
        },
        updateTasksStatus: {
          runId,
        },
        updateTasksPriority: {
          runId,
        },
        assignTasksToMilestone: {
          runId,
        },
        deleteTask: {
          runId,
        },
        createArea: {
          runId,
        },
        updateArea: {
          runId,
        },
        setAreaArchived: {
          runId,
        },
        deleteArea: {
          runId,
        },
        createProject: {
          runId,
        },
        updateProject: {
          runId,
        },
        setProjectArchived: {
          runId,
        },
        deleteProject: {
          runId,
        },
        createDocument: {
          runId,
        },
        updateDocument: {
          runId,
        },
        deleteDocument: {
          runId,
        },
        createMilestones: {
          runId,
        },
        updateMilestone: {
          runId,
        },
        updateMilestonesStatus: {
          runId,
        },
        moveMilestone: {
          runId,
        },
        deleteMilestone: {
          runId,
        },
      },
      toolApproval: Object.fromEntries(
        Object.entries(toolContextMap)
          .filter(([, context]) => context.requiresApproval)
          .map(([toolName]) => [toolName, "user-approval"]),
      ),
      timeout: {
        totalMs: remainingGenerationMs,
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
          await updateChatRunDb(
            runId,
            { status: "running-tool" },
            { attemptStartedAt: ownedAttemptStartedAt },
          );
        }
      },
      onStepEnd: async ({ performance }) => {
        responseTimeMs += performance.stepTimeMs;
        if (runId) {
          streamedArtifacts = await getRunArtifacts(runId);
        }
      },
    });

    return await createAgentUIStreamResponse({
      agent: chatAgent,
      uiMessages: messages,
      abortSignal: attemptSignal,
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
        const errorMessage = isError(error)
          ? error.message
          : "Something went wrong during generation. Please try again.";

        generationError = errorMessage;
        return errorMessage;
      },
      experimental_transform: () => {
        const finalizedInputs = new Set<string>();

        return new TransformStream<
          TextStreamPart<typeof tools>,
          TextStreamPart<typeof tools>
        >({
          transform(part, controller) {
            if (part.type === "tool-call") {
              finalizedInputs.add(part.toolCallId);
            }

            if (
              part.type === "tool-input-delta" &&
              finalizedInputs.has(part.id) &&
              part.delta.trim() === ""
            )
              return;

            controller.enqueue(part);
          },
        });
      },
      onEnd: async ({ responseMessage, isAborted }) => {
        if (!runId || !attemptStartedAt || !responseMessage?.id) return;

        const pendingApprovalParts = responseMessage.parts.filter(
          (part) => isToolUIPart(part) && part.state === "approval-requested",
        );
        const hasPendingApproval = pendingApprovalParts.length > 0;

        const roundedRTM = Math.round(responseTimeMs);

        const updateAssistantChatMessage = async (tx: DbTransaction) => {
          const existingLastAssistantMessage =
            await tx.query.ChatMessageTable.findFirst({
              where: and(
                eq(ChatMessageTable.chatId, chatId),
                eq(ChatMessageTable.role, "assistant"),
                eq(ChatMessageTable.responseToClientId, latestUserMessage.id),
              ),
              orderBy: desc(ChatMessageTable.createdAt),
            });

          if (existingLastAssistantMessage) {
            if (existingLastAssistantMessage.modelId !== selectedModel) {
              await tx
                .update(ChatMessageTable)
                .set({ modelId: selectedModel })
                .where(
                  eq(ChatMessageTable.id, existingLastAssistantMessage.id),
                );
            }

            return existingLastAssistantMessage;
          }

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

          return insertedMessage;
        };

        const handlePartsUpdate = async (tx: DbTransaction) => {
          const insertedMessage = await updateAssistantChatMessage(tx);

          const existingParts = await tx
            .select({
              count: count(),
            })
            .from(MessagePartTable)
            .where(eq(MessagePartTable.messageId, insertedMessage.id))
            .limit(1);

          const existingPartsCount = existingParts?.[0]?.count ?? 0;

          const insertedParts = await tx
            .delete(MessagePartTable)
            .where(eq(MessagePartTable.messageId, insertedMessage.id))
            .returning();
          if (insertedParts.length !== existingPartsCount)
            throw new Error("Failed to delete all previous parts.");

          if (responseMessage.parts.length > 0) {
            await tx.insert(MessagePartTable).values(
              responseMessage.parts.map((part, order) => ({
                messageId: insertedMessage.id,
                order,
                part,
              })),
            );
          }

          return insertedMessage;
        };

        if (hasPendingApproval && !generationError && !isAborted) {
          await withChatRunAttemptDb(
            ownedRunId,
            ownedAttemptStartedAt,
            async (tx) => {
              const insertedMessage = await handlePartsUpdate(tx);

              if (runId) {
                await updateChatRunDb(
                  runId,
                  {
                    status: "awaiting-approval",
                    responseTimeMs: roundedRTM,
                    assistantMessageId: insertedMessage.id,
                  },
                  { tx, attemptStartedAt: ownedAttemptStartedAt },
                );
              }
            },
          );

          return;
        }

        await withChatRunAttemptDb(
          ownedRunId,
          ownedAttemptStartedAt,
          async (tx) => {
            const insertedMessage = await handlePartsUpdate(tx);

            if (runId) {
              await updateChatRunDb(
                runId,
                {
                  status: generationError
                    ? "failed"
                    : isAborted
                      ? "cancelled"
                      : "completed",
                  assistantMessageId: insertedMessage.id,
                  finishedAt: generationError
                    ? new Date()
                    : isAborted
                      ? null
                      : new Date(),
                  responseTimeMs: roundedRTM,
                  error: generationError,
                },
                { tx, attemptStartedAt: ownedAttemptStartedAt },
              );
            }
            responseTimeMs = 0;
          },
        );
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

    if (!runId || !attemptStartedAt) return response;

    const failedRunId = runId;
    const failedAttemptStartedAt = attemptStartedAt;
    const userMessageClientId = latestUserMessage?.id;
    let assistantMessageClientId: string | null = null;

    try {
      await withChatRunAttemptDb(
        failedRunId,
        failedAttemptStartedAt,
        async (tx) => {
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

            const insertedChatMessagePart =
              await tx.query.MessagePartTable.findFirst({
                where: and(
                  eq(MessagePartTable.messageId, userMessageId),
                  eq(MessagePartTable.order, 0),
                ),
              });
            if (!insertedChatMessagePart) {
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
            }

            const existingAssistantResponse =
              await tx.query.ChatMessageTable.findFirst({
                where: and(
                  eq(ChatMessageTable.role, "assistant"),
                  eq(ChatMessageTable.chatId, chatId),
                  eq(ChatMessageTable.responseToClientId, userMessageClientId),
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
          await updateChatRunDb(
            failedRunId,
            {
              assistantMessageId: assistantMessageClientId,
              status: "failed",
              error: errorMessage,
              finishedAt: new Date(),
            },
            { tx, attemptStartedAt: failedAttemptStartedAt },
          );
        },
      );
    } catch (error) {
      console.error(error);
    }

    if (runId) {
      try {
        await updateChatRunDb(
          runId,
          {
            status: "failed",
            error: errorMessage,
            finishedAt: new Date(),
          },
          { attemptStartedAt: failedAttemptStartedAt },
        );
      } catch (error) {
        console.error("Failed to record chat failure: ", error);
      }
    }

    return response;
  }
};
