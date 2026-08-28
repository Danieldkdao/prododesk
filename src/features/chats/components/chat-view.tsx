"use client";

import { useChatProvider } from "@/hooks/use-chat-provider";
import { convertPersistedMessage } from "@/services/ai/helpers";
import { CustomUIMessage } from "@/services/ai/types";
import { useEffect, useMemo } from "react";
import { ReadChatActionReturnType } from "../actions/actions";
import { ChatViewList } from "./chat-view-list";

export const ChatView = ({ chat }: { chat: ReadChatActionReturnType }) => {
  const { id: activeChatId, messages, setMessages, status } = useChatProvider();

  const persistedMessages: CustomUIMessage[] = useMemo(() => {
    return chat.messages.map((msg) =>
      convertPersistedMessage(msg),
    ) as unknown as CustomUIMessage[];
  }, [chat.messages]);

  const isActiveChat = activeChatId === chat.id;

  const displayedMessages =
    isActiveChat && messages.length > 0 ? messages : persistedMessages;

  useEffect(() => {
    if (activeChatId !== chat.id || messages.length !== 0 || status !== "ready")
      return;

    setMessages((messages) => {
      if (messages.length > 0) {
        return messages;
      }
      return persistedMessages;
    });
  }, [
    messages.length,
    status,
    setMessages,
    persistedMessages,
    activeChatId,
    chat.id,
  ]);

  return <ChatViewList chat={chat} messages={displayedMessages} />;
};
