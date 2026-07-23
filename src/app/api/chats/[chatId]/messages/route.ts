import { db } from "@/db/db";
import { ChatMessageTable, MessagePartTable } from "@/db/schema";
import { confirmChatOwnership } from "@/features/chats/server/chats";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  NO_PERMISSION_DATA_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { CustomUIMessage } from "@/services/ai/types";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = async (
  req: Request,
  ctx: RouteContext<"/api/chats/[chatId]/messages">,
) => {
  const { chatId } = await ctx.params;

  console.log();

  const { userId } = await getCurrentUser();
  if (!userId)
    return NextResponse.json(
      { error: UNAUTHED_ERROR_MESSAGE },
      { status: 401 },
    );

  const existingChat = await confirmChatOwnership(userId, chatId);
  if (!existingChat)
    return NextResponse.json(
      { error: NO_PERMISSION_DATA_MESSAGE },
      { status: 403 },
    );

  const chatMessages = await db.query.ChatMessageTable.findMany({
    where: eq(ChatMessageTable.chatId, existingChat.id),
    with: {
      parts: {
        orderBy: asc(MessagePartTable.order),
      },
    },
  });

  const convertedMessages = chatMessages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    parts: msg.parts.map(({ part }) => part),
    metadata: {
      createdAt: msg.createdAt,
      modelId: msg.modelId,
    },
  })) as unknown as CustomUIMessage[];

  return NextResponse.json({ data: convertedMessages });
};
