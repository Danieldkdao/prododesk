"use client";

import { SetterType } from "@/lib/types";
import { ModelId } from "@/services/ai/model-ids";
import { CustomUIMessage } from "@/services/ai/types";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  generateId,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { usePathname } from "next/navigation";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  cancelledMessageIds: Set<string>;
  setCancelledMessageIds: SetterType<Set<string>>;
};

const ChatProviderContext = createContext<ChatProviderContextType | null>(null);

const getChatId = (pathname: string) => {
  return pathname.match(/^\/dashboard\/ai\/chat\/([^/]+)$/)?.[1];
};

export const ChatContextProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const routeChatId = getChatId(pathname);

  const chatId = routeChatId ?? "pending-chat";

  const [cancelledMessageIds, setCancelledMessageIds] = useState<Set<string>>(
    new Set(),
  );
  const [queuedMessage, setQueuedMessage] = useState<QueuedMessage>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId | null>(null);

  const chatRef = useRef<ReturnType<typeof useChat<CustomUIMessage>>>(null);

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
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onData: async (part) => {
      if (part.type !== "data-chat-sync-required") return;

      const response = await fetch(`/api/chats/${part.data.chatId}/messages`);
      if (!response.ok) return;

      const data: { data: CustomUIMessage[] } | { error: string } =
        await response.json();
      if ("error" in data) return;

      const messages = data.data;

      chatRef.current?.setMessages(messages);
    },
    onError: (error) => {
      chatRef.current?.setMessages([
        ...(chatRef.current.messages ?? []),
        {
          id: generateId(),
          parts: [],
          role: "assistant",
          metadata: { runStatus: "failed", runError: error.message },
        },
      ]);
    },
    onFinish: ({ message, isAbort }) => {
      if (!isAbort) return;

      setCancelledMessageIds((current) => {
        const next = new Set(current);
        next.add(message.id);
        return next;
      });
    },
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
    chatRef.current = data;
  }, [data]);

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
        cancelledMessageIds,
        setCancelledMessageIds,
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
