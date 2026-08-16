import { db, DbMutationOptions } from "@/db/db";
import {
  ToolExecutionInsertType,
  ToolExecutionSelectType,
  ToolExecutionTable,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const upsertToolExecutionDb = async (
  toolExecution: ToolExecutionInsertType,
  options?: DbMutationOptions,
) => {
  const { tx } = options ?? {};
  const [insertedToolExecution] = await (tx ?? db)
    .insert(ToolExecutionTable)
    .values(toolExecution)
    .onConflictDoUpdate({
      target: [ToolExecutionTable.runId, ToolExecutionTable.toolCallId],
      set: toolExecution,
    })
    .returning();

  return insertedToolExecution;
};

export const updateToolExecutionDb = async (
  runId: string,
  toolCallId: string,
  toolExecution: Partial<Pick<ToolExecutionSelectType, "status" | "output">>,
  options?: DbMutationOptions,
) => {
  const { tx } = options ?? {};
  const [updatedToolExecution] = await (tx ?? db)
    .update(ToolExecutionTable)
    .set(toolExecution)
    .where(
      and(
        eq(ToolExecutionTable.runId, runId),
        eq(ToolExecutionTable.toolCallId, toolCallId),
      ),
    )
    .returning();

  return updatedToolExecution;
};

export const findToolExecutionDb = async (
  runId: string,
  toolCallId: string,
) => {
  return db.query.ToolExecutionTable.findFirst({
    where: and(
      eq(ToolExecutionTable.runId, runId),
      eq(ToolExecutionTable.toolCallId, toolCallId),
    ),
  });
};
