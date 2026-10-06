"use client";

import { AIChatInput } from "@/components/ai-chat-input";
import { AILoadingAnimation } from "@/components/ai-loading-animation";
import { Button } from "@/components/ui/button";
import { Message, MessageContent } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { UPLOAD_LIMITS } from "@/features/uploads/lib/constants";
import { useChatProvider } from "@/hooks/use-chat-provider";
import { useFileUploads } from "@/hooks/use-file-uploads";
import { getModelInfo, LLMModel } from "@/services/ai/models";
import { CustomUIMessage } from "@/services/ai/types";
import { useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ReadChatActionReturnType } from "../actions/actions";
import { ChatHeader } from "../chat-header";
import { CHAT_HISTORY_PAGE_SIZE } from "../lib/constants";
import { ChatViewListMessage } from "./chat-view-list-message";

export const ChatViewList = ({
  chat,
  messages,
}: {
  chat: ReadChatActionReturnType;
  messages: CustomUIMessage[];
}) => {
  const {
    selectedModel: selectedModelId,
    status,
    sendChatMessage,
    clearError,
    stop,
    setMessages,
  } = useChatProvider();
  const previousResponseModelId = messages.at(-1)?.metadata?.modelId ?? null;
  const currentModelInfo = getModelInfo(
    selectedModelId ?? previousResponseModelId,
  );

  const [prompt, setPrompt] = useState("");
  const [hasOlderMessages, setHasOlderMessages] = useState(
    chat.hasOlderMessages,
  );
  const [visibleMessageCount, setVisibleMessageCount] = useState(
    CHAT_HISTORY_PAGE_SIZE,
  );
  const visibleMessages = messages.slice(-visibleMessageCount);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const historyRequestRef = useRef<AbortController | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scrollRestoreRef = useRef<{ height: number; top: number } | null>(null);

  useLayoutEffect(
    () => () => {
      historyRequestRef.current?.abort();
    },
    [],
  );
  useLayoutEffect(() => {
    const previous = scrollRestoreRef.current;
    const viewport = viewportRef.current;
    if (!previous || !viewport) return;
    viewport.scrollTop = previous.top + viewport.scrollHeight - previous.height;
    scrollRestoreRef.current = null;
  }, [messages, visibleMessageCount]);

  const loadOlderMessages = async () => {
    if (messages.length > visibleMessageCount) {
      const viewport = viewportRef.current;
      if (viewport)
        scrollRestoreRef.current = {
          height: viewport.scrollHeight,
          top: viewport.scrollTop,
        };
      setVisibleMessageCount((count) => count + CHAT_HISTORY_PAGE_SIZE);
      return;
    }
    const before = messages[0]?.id;
    if (!before || historyRequestRef.current) return;
    const controller = new AbortController();
    historyRequestRef.current = controller;
    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `/api/chats/${chat.id}/messages?before=${encodeURIComponent(before)}`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error("Unable to load older messages.");
      const payload: { data: CustomUIMessage[]; hasOlderMessages: boolean } =
        await response.json();
      if (controller.signal.aborted) return;
      const viewport = viewportRef.current;
      if (viewport && payload.data.length)
        scrollRestoreRef.current = {
          height: viewport.scrollHeight,
          top: viewport.scrollTop,
        };
      setMessages((current) => {
        const currentIds = new Set(current.map((message) => message.id));
        return [
          ...payload.data.filter((message) => !currentIds.has(message.id)),
          ...current,
        ];
      });
      setHasOlderMessages(payload.hasOlderMessages);
      setVisibleMessageCount((count) => count + payload.data.length);
    } catch {
      if (!controller.signal.aborted)
        toast.error("Unable to load older messages. Please try again.");
    } finally {
      if (historyRequestRef.current === controller) {
        historyRequestRef.current = null;
        if (!controller.signal.aborted) setIsLoadingHistory(false);
      }
    }
  };
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(
    currentModelInfo ?? null,
  );

  const attachmentOptions = useFileUploads({
    accept: UPLOAD_LIMITS["chat-attachment"].accept,
    maxFileSizeBytes: UPLOAD_LIMITS["chat-attachment"].maxSize,
    maxFileLimit: 10,
    chatId: chat.id,
  });

  const uploadedFiles = attachmentOptions.uploadedFiles;

  const handleSendMessage = () => {
    if (attachmentOptions.isUploading || attachmentOptions.isAnyFileDeleting)
      return;
    if (!prompt.trim() || !selectedModel)
      return toast.error("Please enter a prompt and select a model.");
    clearError();

    sendChatMessage({
      prompt,
      selectedModel: selectedModel.id,
      chatId: chat.id,
      additionalParts: uploadedFiles,
      metadata: {
        createdAt: new Date(),
      },
    });
    setPrompt("");
    attachmentOptions.clearFiles();
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8 h-full min-h-0">
      <ChatHeader
        chat={chat}
        shimmerText={
          messages.length === 1 &&
          (status === "submitted" || status === "streaming")
        }
      />
      <MessageScrollerProvider autoScroll>
        <MessageScroller className="flex-1 min-h-0 w-full">
          <MessageScrollerViewport ref={viewportRef}>
            <MessageScrollerContent>
              {(chat.hasOlderMessages ||
                messages.length > CHAT_HISTORY_PAGE_SIZE) && (
                <p className="text-center text-xs text-muted-foreground">
                  Earlier messages are saved. AI responses use recent
                  conversation context.
                </p>
              )}
              {(hasOlderMessages || messages.length > visibleMessageCount) && (
                <Button
                  type="button"
                  variant="outline"
                  className="self-center"
                  disabled={
                    isLoadingHistory ||
                    status === "submitted" ||
                    status === "streaming"
                  }
                  onClick={loadOlderMessages}
                >
                  {isLoadingHistory
                    ? "Loading older messages…"
                    : "Load older messages"}
                </Button>
              )}
              {visibleMessages.map((msg) => (
                <ChatViewListMessage
                  key={msg.id}
                  msg={msg}
                  messages={messages}
                  selectedModel={selectedModel}
                />
              ))}
              {status === "submitted" && (
                <MessageScrollerItem>
                  <Message align="start">
                    <MessageContent className="flex flex-col gap-0.5 h-15">
                      <TextShimmer
                        as="span"
                        duration={2}
                        className="text-base italic font-medium [--base-color:var(--muted-foreground)]"
                      >
                        Prododesk AI is thinking...
                      </TextShimmer>
                      <AILoadingAnimation />
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      <AIChatInput
        value={prompt}
        onValueChange={setPrompt}
        selectedModel={selectedModel}
        onSelectedModelChange={setSelectedModel}
        onSubmit={handleSendMessage}
        onStop={stop}
        isPending={status === "submitted" || status === "streaming"}
        attachmentOptions={attachmentOptions}
      />
    </div>
  );
};
