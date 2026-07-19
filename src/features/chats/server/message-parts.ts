import { db, DbTransaction } from "@/db/db";
import {
  MessagePartInsertType,
  MessagePartTable,
} from "@/db/schemas/message-part";

export const insertMessagePartDb = async (
  messagePart: MessagePartInsertType,
  tx?: DbTransaction,
) => {
  const [insertedMessagePart] = await (tx ?? db)
    .insert(MessagePartTable)
    .values(messagePart)
    .returning();

  return insertedMessagePart;
};
