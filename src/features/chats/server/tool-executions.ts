import { db, DbTransaction } from "@/db/db";
import { ToolExecutionInsertType, ToolExecutionTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const executeMutationToolDb = async (
  execution: Pick<ToolExecutionInsertType, "runId" | "toolCallId" | "toolName">,
  execute: (tx: DbTransaction) => Promise<string | undefined>,
): Promise<string> => {
  return db.transaction(async (tx) => {
    const executionFilter = and(
      eq(ToolExecutionTable.runId, execution.runId),
      eq(ToolExecutionTable.toolCallId, execution.toolCallId),
    );
    const [existing] = await tx
      .select()
      .from(ToolExecutionTable)
      .where(executionFilter)
      .for("update");

    if (existing?.status === "completed") {
      return typeof existing.output === "string"
        ? existing.output
        : (JSON.stringify(existing.output) ?? "No output.");
    }

    const interruptedMessage =
      "An earlier attempt was interrupted and its result could not be confirmed. Check your workspace before requesting this change again.";
    if (
      existing?.status === "pending" ||
      existing?.error === interruptedMessage
    ) {
      await tx
        .update(ToolExecutionTable)
        .set({
          status: "failed",
          error: interruptedMessage,
          output: interruptedMessage,
        })
        .where(eq(ToolExecutionTable.id, existing.id));
      return interruptedMessage;
    }

    const pendingExecution = {
      ...execution,
      status: "pending" as const,
      error: null,
      output: null,
    };
    await tx
      .insert(ToolExecutionTable)
      .values(pendingExecution)
      .onConflictDoUpdate({
        target: [ToolExecutionTable.runId, ToolExecutionTable.toolCallId],
        set: pendingExecution,
      });
    const output = (await execute(tx)) ?? "No output.";
    await tx
      .update(ToolExecutionTable)
      .set({ status: "completed", output })
      .where(executionFilter);
    return output;
  });
};
