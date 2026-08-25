"use client";

import { AIChatInput } from "@/components/ai-chat-input";
import { AILoadingAnimation } from "@/components/ai-loading-animation";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { useChatProvider } from "@/hooks/use-chat-provider";
import { useFileUploads } from "@/hooks/use-file-uploads";
import { generateFileUrl } from "@/lib/utils";
import { getModelInfo, LLMModel } from "@/services/ai/models";
import { CustomUIMessage } from "@/services/ai/types";
import { useState } from "react";
import { toast } from "sonner";
import { ReadChatActionReturnType } from "../actions/actions";
import { ChatHeader } from "../chat-header";
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
  } = useChatProvider();
  const previousResponseModelId = messages.at(-1)?.metadata?.modelId ?? null;
  const currentModelInfo = getModelInfo(
    selectedModelId ?? previousResponseModelId,
  );

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(
    currentModelInfo ?? null,
  );

  const attachmentOptions = useFileUploads({
    keyPrefix: "ai-chat",
    accept: "image/jpeg, image/png, application/pdf, .jpg, .jpeg",
    maxFileLimit: 10,
  });

  const handleSendMessage = () => {
    if (attachmentOptions.isUploading || attachmentOptions.isDeleting) return;
    if (!prompt.trim() || !selectedModel)
      return toast.error("Please enter a prompt and select a model.");
    clearError();

    const uploadedFiles = Array.from(attachmentOptions.files, ([id, file]) => ({
      id,
      name: file.name,
      type: file.type ?? "application/octet-stream",
      storageKey: file.key,
      url: generateFileUrl(file.key),
    }));

    sendChatMessage({
      prompt,
      selectedModel: selectedModel.id,
      chatId: chat.id,
      additionalParts: uploadedFiles.map((file) => ({
        type: "file",
        mediaType: file.type,
        url: file.url,
        filename: file.name,
        providerMetadata: {
          prododesk: {
            storageKey: file.storageKey,
          },
        },
      })),
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
          <MessageScrollerViewport>
            <MessageScrollerContent>
              {messages.map((msg) => (
                <ChatViewListMessage
                  key={msg.id}
                  msg={msg}
                  messages={messages}
                  currentModelInfo={currentModelInfo}
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
