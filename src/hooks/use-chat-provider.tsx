"use client";

import { SetterType } from "@/lib/types";
import { CHAT_HISTORY_PAGE_SIZE } from "@/features/chats/lib/constants";
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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ChatMessage = {
  prompt: string;
  selectedModel: ModelId;
  chatId?: string;
  additionalParts?: CustomUIMessage["parts"];
  metadata?: CustomUIMessage["metadata"];
} | null;

type ChatProviderContextType = ReturnType<typeof useChat<CustomUIMessage>> & {
  sendChatMessage: (message: NonNullable<ChatMessage>) => void;
  selectedModel: ModelId | null;
  queuedMessage: ChatMessage;
  sendQueuedMessage: (message: ChatMessage) => void;
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
  const [queuedMessage, setQueuedMessage] = useState<ChatMessage>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId | null>(null);

  const sendQueuedMessage = useCallback((message: ChatMessage) => {
    if (message) setSelectedModel(message.selectedModel);
    setQueuedMessage(message);
  }, []);

  return (
    <ChatSessionProvider
      key={chatId}
      chatId={chatId}
      selectedModel={selectedModel}
      setSelectedModel={setSelectedModel}
      queuedMessage={queuedMessage}
      setQueuedMessage={setQueuedMessage}
      sendQueuedMessage={sendQueuedMessage}
      cancelledMessageIds={cancelledMessageIds}
      setCancelledMessageIds={setCancelledMessageIds}
    >
      {children}
    </ChatSessionProvider>
  );
};

const ChatSessionProvider = ({
  children,
  chatId,
  selectedModel,
  setSelectedModel,
  queuedMessage,
  setQueuedMessage,
  sendQueuedMessage,
  cancelledMessageIds,
  setCancelledMessageIds,
}: {
  children: ReactNode;
  chatId: string;
  selectedModel: ModelId | null;
  setSelectedModel: SetterType<ModelId | null>;
  queuedMessage: ChatMessage;
  setQueuedMessage: SetterType<ChatMessage>;
  sendQueuedMessage: ChatProviderContextType["sendQueuedMessage"];
  cancelledMessageIds: Set<string>;
  setCancelledMessageIds: SetterType<Set<string>>;
}) => {
  const isActiveRef = useRef(false);
  const syncRequestRef = useRef<AbortController | null>(null);
  const setMessagesRef = useRef<ChatProviderContextType["setMessages"] | null>(
    null,
  );
  const sentQueuedMessageRef = useRef<ChatMessage>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<CustomUIMessage>({
        api: "/api/chat",
        body: { chatId, selectedModel },
        prepareSendMessagesRequest: ({
          id,
          body,
          messages,
          trigger,
          messageId,
        }) => ({
          body: {
            ...body,
            id,
            messages: messages.slice(-CHAT_HISTORY_PAGE_SIZE),
            trigger,
            messageId,
          },
        }),
      }),
    [chatId, selectedModel],
  );

  const data = useChat<CustomUIMessage>({
    id: chatId,
    transport,
    throttle: 50,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onData: async (part) => {
      if (part.type !== "data-chat-sync-required") return;
      const targetId = part.data.chatId;
      if (chatId !== targetId || !isActiveRef.current) return;
      syncRequestRef.current?.abort();
      const controller = new AbortController();
      syncRequestRef.current = controller;
      try {
        const response = await fetch(`/api/chats/${targetId}/messages`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload: { data: CustomUIMessage[] } | { error: string } =
          await response.json();
        if (
          "error" in payload ||
          controller.signal.aborted ||
          !isActiveRef.current
        )
          return;
        setMessagesRef.current?.((messages) => {
          const firstIndex = messages.findIndex(
            (message) => message.id === payload.data[0]?.id,
          );
          return [
            ...(firstIndex > 0 ? messages.slice(0, firstIndex) : []),
            ...payload.data,
          ];
        });
      } catch (error) {
        if (!controller.signal.aborted)
          console.error("Unable to synchronize chat:", error);
      } finally {
        if (syncRequestRef.current === controller)
          syncRequestRef.current = null;
      }
    },
    onError: (error) => {
      if (!isActiveRef.current) return;
      setMessagesRef.current?.((messages) => {
        const lastMessage = messages.at(-1);
        if (!lastMessage) return messages;

        if (lastMessage.role === "assistant") {
          return messages.map((msg) => {
            if (msg.id === lastMessage.id) {
              return {
                ...msg,
                metadata: {
                  ...msg.metadata,
                  runStatus: "failed",
                  runError: error.message,
                },
              };
            }
            return msg;
          });
        }
        return [
          ...messages,
          {
            id: generateId(),
            parts: [],
            role: "assistant",
            metadata: { runStatus: "failed", runError: error.message },
          },
        ];
      });
    },
    onFinish: ({ message, isAbort }) => {
      if (!isActiveRef.current) return;
      if (!isAbort) return;

      setCancelledMessageIds((current) => {
        const next = new Set(current);
        next.add(message.id);
        return next;
      });
    },
  });

  const { sendMessage, setMessages, stop } = data;

  useLayoutEffect(() => {
    isActiveRef.current = true;
    setMessagesRef.current = setMessages;
    return () => {
      isActiveRef.current = false;
      setMessagesRef.current = null;
      syncRequestRef.current?.abort();
      void stop();
    };
  }, [setMessages, stop]);

  const sendChatMessage = useCallback(
    ({
      prompt,
      selectedModel,
      chatId,
      additionalParts,
      metadata,
    }: NonNullable<ChatMessage>) => {
      setSelectedModel(selectedModel);
      void sendMessage(
        {
          parts: [{ type: "text", text: prompt }, ...(additionalParts ?? [])],
          role: "user",
          metadata,
        },
        { body: { selectedModel, chatId } },
      );
    },
    [sendMessage, setSelectedModel],
  );

  useEffect(() => {
    if (!queuedMessage || queuedMessage.chatId !== chatId) return;

    const message = queuedMessage;
    let cancelled = false;

    queueMicrotask(() => {
      if (
        cancelled ||
        !isActiveRef.current ||
        sentQueuedMessageRef.current === message
      )
        return;
      sentQueuedMessageRef.current = message;
      setQueuedMessage((current) => (current === message ? null : current));
      sendChatMessage(message);
    });

    return () => {
      cancelled = true;
    };
  }, [chatId, queuedMessage, sendChatMessage, setQueuedMessage]);

  return (
    <ChatProviderContext
      value={{
        ...data,
        setMessages,
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
