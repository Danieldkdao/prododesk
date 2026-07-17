"use client";

import { useChatProvider } from "@/hooks/use-chat-provider";
import { CustomUIMessage } from "@/services/ai/types";
import { useEffect, useMemo } from "react";
import { GetChatActionReturnType } from "../actions/actions";
import { ChatViewList } from "./chat-view-list";
import { PendingChatView } from "./pending-chat-view";

export const ChatView = ({ chat }: { chat: GetChatActionReturnType }) => {
  const {
    id: activeChatId,
    messages,
    setMessages,
    selectedModel,
    status,
  } = useChatProvider();

  const persistedMessages: CustomUIMessage[] = useMemo(() => {
    return chat.messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      parts: [
        {
          type: "text",
          text: msg.content,
        },
      ],
      metadata: {
        createdAt: msg.createdAt,
        modelId: msg.modelId,
      },
    }));
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

  const latestPrompt = messages
    .filter((message) => message.role === "user")
    .at(-1)
    ?.parts.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  if (
    messages.length === 1 &&
    selectedModel &&
    latestPrompt &&
    (status === "submitted" || status === "streaming")
  ) {
    return (
      <PendingChatView prompt={latestPrompt} selectedModel={selectedModel} />
    );
  }

  return <ChatViewList chat={chat} messages={displayedMessages} />;
};
