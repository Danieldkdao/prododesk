"use client";

import { ModelId } from "@/services/ai/models";
import { CustomUIMessage } from "@/services/ai/types";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname } from "next/navigation";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type QueuedMessage = {
  prompt: string;
  selectedModel: ModelId;
  chatId: string;
} | null;
type ChatProviderContextType = ReturnType<typeof useChat<CustomUIMessage>> & {
  sendChatMessage: ({
    prompt,
    selectedModel,
    chatId,
  }: {
    prompt: string;
    selectedModel: ModelId;
    chatId?: string;
  }) => void;
  selectedModel: ModelId | null;
  queuedMessage: QueuedMessage;
  sendQueuedMessage: (message: QueuedMessage) => void;
};

const ChatProviderContext = createContext<ChatProviderContextType | null>(null);

const getChatId = (pathname: string) => {
  return pathname.match(/^\/dashboard\/ai\/chat\/([^/]+)$/)?.[1];
};

export const ChatContextProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const routeChatId = getChatId(pathname);

  const chatId = routeChatId ?? "pending-chat";

  const [queuedMessage, setQueuedMessage] = useState<QueuedMessage>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId | null>(null);

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: "/api/chat",
      body: {
        chatId,
        selectedModel,
      },
    });
  }, [chatId, selectedModel]);

  const data = useChat<CustomUIMessage>({
    id: chatId,
    transport,
  });

  const sendChatMessage = useCallback(
    ({
      prompt,
      selectedModel,
      chatId,
    }: {
      prompt: string;
      selectedModel: ModelId;
      chatId?: string;
    }) => {
      setSelectedModel(selectedModel);
      data.sendMessage(
        {
          parts: [{ type: "text", text: prompt }],
          role: "user",
        },
        { body: { selectedModel, chatId } },
      );
    },
    [data],
  );

  const sendQueuedMessage = (message: QueuedMessage) => {
    if (message) {
      setSelectedModel(message.selectedModel);
    }

    setQueuedMessage(message);
  };

  useEffect(() => {
    if (!queuedMessage || queuedMessage.chatId !== data.id) return;

    const message = queuedMessage;

    setQueuedMessage(null);
    sendChatMessage(message);
  }, [data.id, queuedMessage, sendChatMessage]);

  return (
    <ChatProviderContext
      value={{
        ...data,
        sendChatMessage,
        selectedModel,
        queuedMessage,
        sendQueuedMessage,
      }}
    >
      {children}
    </ChatProviderContext>
  );
};

export const useChatProvider = () => {
  const context = useContext(ChatProviderContext);
  if (!context)
    throw new Error(
      "Chat provider context must be used inside the chat context provider",
    );

  return context;
};
