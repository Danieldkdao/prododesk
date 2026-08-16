"use client";

import { useChatProvider } from "@/hooks/use-chat-provider";
import { CustomUIMessage } from "@/services/ai/types";
import { useEffect, useMemo } from "react";
import { ReadChatActionReturnType } from "../actions/actions";
import { ChatViewList } from "./chat-view-list";

export const ChatView = ({ chat }: { chat: ReadChatActionReturnType }) => {
  const { id: activeChatId, messages, setMessages, status } = useChatProvider();

  const persistedMessages: CustomUIMessage[] = useMemo(() => {
    return chat.messages.map((msg) => ({
      id: msg.clientMessageId,
      role: msg.role,
      parts: msg.parts.map(({ part }) => part),
      metadata: {
        createdAt: msg.createdAt,
        modelId: msg.modelId,
        chatId: msg.chatId,
        runError: msg.chatRun?.error,
        responseTimeMs: msg.chatRun?.responseTimeMs,
        runStatus: msg.chatRun?.status,
        responseToClientId: msg.responseToClientId,
      },
    })) as unknown as CustomUIMessage[];
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
