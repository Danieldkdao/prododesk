"use client";

import { AIChatInput } from "@/components/ai-chat-input";
import { AILoadingAnimation } from "@/components/ai-loading-animation";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { SimpleIcon } from "@/components/simple-icon";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { UserAvatar } from "@/components/user-avatar";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useChatProvider } from "@/hooks/use-chat-provider";
import { getModelInfo, LLMModel } from "@/services/ai/models";
import { useState } from "react";
import { toast } from "sonner";
import { GetChatActionReturnType } from "../actions/actions";
import { CustomUIMessage } from "@/services/ai/types";
import { format, isSameDay } from "date-fns";

export const ChatViewList = ({
  chat,
  messages,
}: {
  chat: GetChatActionReturnType;
  messages: CustomUIMessage[];
}) => {
  const { data: session } = useAuthSession();
  const {
    selectedModel: selectedModelId,
    status,
    sendChatMessage,
  } = useChatProvider();
  const previousResponseModelId = messages.at(-1)?.metadata?.modelId ?? null;
  const currentModelInfo = getModelInfo(
    selectedModelId ?? previousResponseModelId,
  );

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(
    currentModelInfo ?? null,
  );

  const handleSendMessage = () => {
    if (!prompt.trim() || !selectedModel)
      return toast.error("Please enter a prompt and select a model.");
    sendChatMessage({
      prompt,
      selectedModel: selectedModel.id,
      chatId: chat.id,
    });
    setPrompt("");
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8 h-full min-h-0">
      <MessageScrollerProvider autoScroll>
        <MessageScroller className="flex-1 min-h-0 w-full">
          <MessageScrollerViewport>
            <MessageScrollerContent>
              {messages.map((msg) => {
                const messageContent = msg.parts
                  .filter((part) => part.type === "text")
                  .map((part) => part.text)
                  .join("");
                const modelInfo = getModelInfo(msg.metadata?.modelId);
                const isLatestMsg = messages.at(-1)?.id === msg.id;

                return (
                  <MessageScrollerItem key={msg.id}>
                    <Message align={msg.role === "user" ? "end" : "start"}>
                      <MessageAvatar>
                        {msg.role === "user" ? (
                          <UserAvatar
                            name={session?.user.name ?? "You"}
                            image={session?.user.image}
                            className="size-10"
                          />
                        ) : (
                          <div className="size-10 shrink-0 rounded-full bg-muted flex items-center justify-center">
                            {modelInfo || currentModelInfo ? (
                              // @ts-expect-error This is fine because the condition above guarantees that at least one of the values exists so the code below should always work when the condition above passes
                              <SimpleIcon
                                {...(modelInfo?.logo ?? currentModelInfo?.logo)}
                              />
                            ) : (
                              <span className="text-base font-medium text-muted-foreground">
                                AI
                              </span>
                            )}
                          </div>
                        )}
                      </MessageAvatar>
                      <MessageContent>
                        <Bubble variant="secondary" align="start">
                          <BubbleContent className="text-lg">
                            {msg.role === "user" ? (
                              messageContent
                            ) : (
                              <MarkdownRenderer
                                animated={{
                                  animation: "blurIn",
                                  duration: 250,
                                  easing: "ease-out",
                                }}
                                isAnimating={
                                  status === "streaming" && isLatestMsg
                                }
                              >
                                {messageContent}
                              </MarkdownRenderer>
                            )}
                          </BubbleContent>
                        </Bubble>
                        {msg.role === "user" && msg.metadata?.createdAt && (
                          <MessageFooter>
                            Sent at {format(msg.metadata.createdAt, "p")}{" "}
                            {isSameDay(new Date(), msg.metadata.createdAt)
                              ? "earlier today"
                              : format(msg.metadata.createdAt, " 'on' PP")}
                          </MessageFooter>
                        )}
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                );
              })}
              {/*todo: add error state as well*/}
              {status === "submitted" && (
                <MessageScrollerItem>
                  <Message align="start">
                    <MessageAvatar>
                      <div className="size-10 shrink-0 rounded-full bg-muted flex items-center justify-center">
                        {currentModelInfo ? (
                          <SimpleIcon {...currentModelInfo.logo} />
                        ) : (
                          <span className="text-base font-medium text-muted-foreground">
                            AI
                          </span>
                        )}
                      </div>
                    </MessageAvatar>

                    <MessageContent className="flex flex-col gap-0.5 h-15">
                      <span className="text-muted-foreground text-base italic font-medium">
                        Prododesk AI is thinking...
                      </span>
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
        isPending={status === "submitted" || status === "streaming"}
      />
    </div>
  );
};
