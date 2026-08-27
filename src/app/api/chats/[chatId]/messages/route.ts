import { db } from "@/db/db";
import { ChatMessageTable, MessagePartTable } from "@/db/schema";
import { confirmUserChatOwnership } from "@/features/chats/server/chats";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  NO_PERMISSION_DATA_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { areValidIds } from "@/lib/utils";
import { convertPersistedMessage } from "@/services/ai/helpers";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = async (
  req: Request,
  ctx: RouteContext<"/api/chats/[chatId]/messages">,
) => {
  const { chatId } = await ctx.params;

  if (!areValidIds(chatId)) {
    return NextResponse.json(
      { error: NOT_FOUND_ERROR_MESSAGE },
      { status: 404 },
    );
  }

  const { userId } = await getCurrentUser();
  if (!userId)
    return NextResponse.json(
      { error: UNAUTHED_ERROR_MESSAGE },
      { status: 401 },
    );

  const existingChat = await confirmUserChatOwnership(chatId);
  if (!existingChat)
    return NextResponse.json(
      { error: NO_PERMISSION_DATA_MESSAGE },
      { status: 403 },
    );

  const chatMessages = await db.query.ChatMessageTable.findMany({
    where: eq(ChatMessageTable.chatId, existingChat.id),
    orderBy: [asc(ChatMessageTable.createdAt), asc(ChatMessageTable.id)],
    with: {
      parts: {
        orderBy: [asc(MessagePartTable.order), asc(MessagePartTable.id)],
      },
      chatRun: {
        with: {
          artifacts: true,
        },
      },
      attachments: true,
    },
  });

  const convertedMessages = chatMessages.map((msg) =>
    convertPersistedMessage(msg),
  );

  return NextResponse.json({ data: convertedMessages });
};
