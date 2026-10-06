import { db, DbMutationOptions, DbTransaction } from "@/db/db";
import {
  ActivityTable,
  ArtifactTable,
  ChatRunInsertType,
  ChatRunSelectType,
  ChatRunTable,
  ChatTable,
} from "@/db/schema";
import { SQLMap } from "@/lib/types";
import { and, eq, getTableColumns, inArray, isNull, sql } from "drizzle-orm";
import { confirmUserChatOwnership } from "./chats";
import { revalidateChatCache } from "./cache/chats";
import {
  ACTIVE_CHAT_RUN_STATUSES,
  CHAT_RUN_LEASE_MS,
  canClaimChatRun,
  nextAttemptStartedAt,
} from "../lib/run-attempt";
import { getCurrentUser } from "@/lib/auth/helpers";

export const findChatRunDb = async (
  query: { id: string } | { chatId: string; userMessageClientId: string },
  tx?: DbTransaction,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const whereQuery =
    "id" in query
      ? eq(ChatRunTable.id, query.id)
      : and(
          eq(ChatRunTable.chatId, query.chatId),
          eq(ChatRunTable.userMessageClientId, query.userMessageClientId),
        );

  const [existingChatRun] =
    (await (tx ?? db)
      .select({
        ...getTableColumns(ChatRunTable),
        chat: getTableColumns(ChatTable),
      })
      .from(ChatRunTable)
      .innerJoin(ChatTable, eq(ChatTable.id, ChatRunTable.chatId))
      .where(and(whereQuery, eq(ChatTable.userId, userId)))) ?? null;
  return existingChatRun;
};

export const claimChatRunDb = async (
  run: ChatRunSelectType & { chat: { userId: string } },
  options: { isNew: boolean; isRegenerating: boolean },
) => {
  const now = new Date();
  if (!canClaimChatRun(run, { ...options, now })) return null;
  if (!(await confirmUserChatOwnership(run.chatId))) return null;
  const startedAt = nextAttemptStartedAt(run.startedAt, now);
  const previousAttempt = run.startedAt
    ? sql`date_trunc('milliseconds', ${ChatRunTable.startedAt}) = ${run.startedAt.toISOString()}::timestamptz`
    : isNull(ChatRunTable.startedAt);
  const expiredLease =
    !options.isNew && ACTIVE_CHAT_RUN_STATUSES.includes(run.status)
      ? sql`(${ChatRunTable.startedAt} IS NULL OR ${ChatRunTable.startedAt} <= NOW() - (${CHAT_RUN_LEASE_MS} * interval '1 millisecond'))`
      : undefined;
  const [claimedChatRun] = await db
    .update(ChatRunTable)
    .set({
      status: "streaming",
      startedAt,
      finishedAt: null,
      error: null,
    })
    .where(
      and(
        eq(ChatRunTable.id, run.id),
        eq(ChatRunTable.status, run.status),
        previousAttempt,
        expiredLease,
      ),
    )
    .returning();
  if (claimedChatRun) revalidateChatCache(run.chat.userId, run.chatId);
  return claimedChatRun ?? null;
};

export const withChatRunAttemptDb = async <T>(
  runId: string,
  startedAt: Date,
  execute: (tx: DbTransaction) => Promise<T>,
): Promise<{ value: T } | null> => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;
  const result = await db.transaction(async (tx) => {
    const [ownedChatRun] = await tx
      .select({ id: ChatRunTable.id, chatId: ChatRunTable.chatId })
      .from(ChatRunTable)
      .innerJoin(ChatTable, eq(ChatTable.id, ChatRunTable.chatId))
      .where(
        and(
          eq(ChatRunTable.id, runId),
          eq(ChatRunTable.startedAt, startedAt),
          eq(ChatTable.userId, userId),
          inArray(ChatRunTable.status, ACTIVE_CHAT_RUN_STATUSES),
        ),
      )
      .for("no key update", { of: ChatRunTable });
    if (!ownedChatRun) return null;
    return { chatId: ownedChatRun.chatId, value: await execute(tx) };
  });

  if (!result) return null;
  revalidateChatCache(userId, result.chatId);
  return { value: result.value };
};

export const insertChatRunDb = async (
  chatRun: ChatRunInsertType,
  options?: DbMutationOptions,
) => {
  const { tx } = options ?? {};
  const existingChat = await confirmUserChatOwnership(
    chatRun.chatId,
    undefined,
    tx,
  );
  if (!existingChat) return null;

  const [insertedChatRun] = await (tx ?? db)
    .insert(ChatRunTable)
    .values(chatRun)
    .onConflictDoNothing()
    .returning();

  revalidateChatCache(existingChat.userId, existingChat.id);

  return insertedChatRun ?? null;
};

export const upsertChatRunDb = async (
  chatRun: ChatRunInsertType,
  options?: DbMutationOptions,
) => {
  const { tx } = options ?? {};
  const existingChat = await confirmUserChatOwnership(
    chatRun.chatId,
    undefined,
    tx,
  );
  if (!existingChat) return null;

  const [upsertedChatRun] = await (tx ?? db)
    .insert(ChatRunTable)
    .values(chatRun)
    .onConflictDoUpdate({
      target: [ChatRunTable.chatId, ChatRunTable.userMessageClientId],
      set: chatRun,
    })
    .returning();

  revalidateChatCache(existingChat.userId, existingChat.id);

  return upsertedChatRun ?? null;
};

export const updateChatRunDb = async (
  runId: string,
  chatRun: SQLMap<
    Partial<
      Pick<
        ChatRunSelectType,
        | "assistantMessageId"
        | "status"
        | "finishedAt"
        | "error"
        | "responseTimeMs"
      >
    >
  >,
  options?: DbMutationOptions & { attemptStartedAt?: Date },
) => {
  const { tx, attemptStartedAt } = options ?? {};
  const existingChatRun = await findChatRunDb({ id: runId }, tx);
  if (!existingChatRun) return null;

  const existingChat = await confirmUserChatOwnership(
    existingChatRun.chatId,
    undefined,
    tx,
  );
  if (!existingChat) return null;

  const [updatedChatRun] = await (tx ?? db)
    .update(ChatRunTable)
    .set(chatRun)
    .where(
      and(
        eq(ChatRunTable.id, existingChatRun.id),
        attemptStartedAt
          ? eq(ChatRunTable.startedAt, attemptStartedAt)
          : undefined,
        attemptStartedAt
          ? inArray(ChatRunTable.status, ACTIVE_CHAT_RUN_STATUSES)
          : undefined,
      ),
    )
    .returning();

  revalidateChatCache(existingChat.userId, existingChat.id);

  return updatedChatRun ?? null;
};

export const getRunArtifacts = async (runId: string) => {
  return db.query.ArtifactTable.findMany({
    where: and(
      eq(ArtifactTable.chatRunId, runId),
      inArray(
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
    ),
    with: {
      activity: true,
    },
  });
};
