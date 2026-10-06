import { readChatHistoryPageDb } from "@/features/chats/server/chat-history";
import { confirmUserChatOwnership } from "@/features/chats/server/chats";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  NO_PERMISSION_DATA_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { areValidIds } from "@/lib/utils";
import { convertPersistedMessage } from "@/services/ai/helpers";
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

  const before = new URL(req.url).searchParams.get("before") ?? undefined;
  if (before && before.length > 256)
    return NextResponse.json(
      { error: "Invalid history cursor." },
      { status: 400 },
    );
  const history = await readChatHistoryPageDb(existingChat.id, before);
  if (!history)
    return NextResponse.json(
      { error: "History cursor not found." },
      { status: 404 },
    );

  const convertedMessages = history.messages.map((msg) =>
    convertPersistedMessage(msg),
  );

  return NextResponse.json({
    data: convertedMessages,
    hasOlderMessages: history.hasOlderMessages,
  });
};
