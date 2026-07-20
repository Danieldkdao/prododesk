"use client";

import { AIChatInput } from "@/components/ai-chat-input";
import { AILoadingAnimation } from "@/components/ai-loading-animation";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { SimpleIcon } from "@/components/simple-icon";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { TextShimmer } from "@/components/ui/text-shimmer";
import { UserAvatar } from "@/components/user-avatar";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useChatProvider } from "@/hooks/use-chat-provider";
import { getModelInfo, LLMModel } from "@/services/ai/models";
import { ToolName } from "@/services/ai/tool-contracts";
import { CustomUIMessage } from "@/services/ai/types";
import { getToolName, isToolUIPart } from "ai";
import { format, isSameDay } from "date-fns";
import { BrainIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { GetChatActionReturnType } from "../actions/actions";
import { ChatHeader } from "../chat-header";
import { formatToolNameForChat, getApprovalReason } from "../lib/formatters";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    error,
    clearError,
    addToolApprovalResponse,
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
    clearError();
    sendChatMessage({
      prompt,
      selectedModel: selectedModel.id,
      chatId: chat.id,
    });
    setPrompt("");
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
              {messages.map((msg) => {
                const messageContent = msg.parts
                  .filter((part) => part.type === "text")
                  .map((part) => part.text)
                  .join(" ");
                const modelInfo = getModelInfo(msg.metadata?.modelId);
                const isLatestMsg = messages.at(-1)?.id === msg.id;

                return (
                  <MessageScrollerItem
                    key={msg.id}
                    scrollAnchor={msg.role === "user"}
                  >
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
                      <MessageContent className="max-w-4/5">
                        <Bubble
                          variant={msg.role === "user" ? "secondary" : "ghost"}
                        >
                          <BubbleContent className="text-lg flex flex-col gap-4 self-end">
                            {msg.role === "user"
                              ? messageContent
                              : msg.parts.map((part, index) => {
                                  const isLatestPart =
                                    index === msg.parts.length - 1;
                                  if (part.type === "text") {
                                    return (
                                      <MarkdownRenderer
                                        key={`${msg.id}-text-${index}`}
                                        animated={{
                                          animation: "blurIn",
                                          duration: 250,
                                          easing: "ease-out",
                                        }}
                                        isAnimating={
                                          status === "streaming" &&
                                          isLatestMsg &&
                                          isLatestPart
                                        }
                                      >
                                        {part.text}
                                      </MarkdownRenderer>
                                    );
                                  }
                                  if (part.type === "reasoning") {
                                    return (
                                      <Collapsible
                                        key={`${msg.id}-text-${index}`}
                                        className="flex flex-col gap-2"
                                      >
                                        <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer">
                                          <BrainIcon className="text-muted-foreground size-5" />
                                          {status === "streaming" &&
                                          isLatestPart ? (
                                            <TextShimmer
                                              as="span"
                                              duration={2}
                                              className="text-base italic font-medium [--base-color:var(--muted-foreground)]"
                                            >
                                              Thinking...
                                            </TextShimmer>
                                          ) : (
                                            <span className="text-base text-muted-foreground font-medium">
                                              Finished thinking
                                            </span>
                                          )}
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="pl-4 border-l border-border">
                                          <MarkdownRenderer
                                            animated={{
                                              animation: "blurIn",
                                              duration: 250,
                                              easing: "ease-out",
                                            }}
                                            isAnimating={
                                              status === "streaming" &&
                                              isLatestMsg &&
                                              isLatestPart
                                            }
                                            className="text-muted-foreground"
                                          >
                                            {part.text}
                                          </MarkdownRenderer>
                                        </CollapsibleContent>
                                      </Collapsible>
                                    );
                                  }
                                  if (isToolUIPart(part)) {
                                    console.log("Tool part state:", {
                                      toolName: getToolName(part),
                                      toolCallId: part.toolCallId,
                                      state: part.state,
                                      part,
                                    });
                                    if (
                                      part.state === "approval-requested" &&
                                      !part.approval.isAutomatic
                                    ) {
                                      const approvalReason = getApprovalReason(
                                        part.input,
                                      );

                                      return (
                                        <div
                                          key={part.toolCallId}
                                          className="flex flex-col gap-2"
                                        >
                                          <span className="text-muted-foreground font-medium text-base">
                                            {approvalReason}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <Button
                                              onClick={() =>
                                                addToolApprovalResponse({
                                                  id: part.approval.id,
                                                  approved: true,
                                                })
                                              }
                                            >
                                              Approve
                                            </Button>
                                            <Button
                                              variant="outline"
                                              onClick={() =>
                                                addToolApprovalResponse({
                                                  id: part.approval.id,
                                                  approved: false,
                                                })
                                              }
                                            >
                                              Deny
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    }
                                    const toolName = getToolName(
                                      part,
                                    ) as ToolName;
                                    const {
                                      running,
                                      finished,
                                      error,
                                      icon: Icon,
                                    } = formatToolNameForChat(toolName);

                                    switch (part.state) {
                                      case "input-streaming":
                                      case "input-available":
                                        return (
                                          <TextShimmer
                                            as="span"
                                            duration={2}
                                            className="text-base italic font-medium [--base-color:var(--muted-foreground)]"
                                            key={part.toolCallId}
                                          >
                                            {`Running ${running}`}
                                          </TextShimmer>
                                        );
                                      case "output-available":
                                        return (
                                          <Collapsible
                                            key={part.toolCallId}
                                            className="flex flex-col gap-2"
                                          >
                                            <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer">
                                              <Icon className="text-muted-foreground size-4.5" />
                                              <span className="text-base font-medium text-muted-foreground">
                                                Finished {finished}
                                              </span>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="pl-4 border-l border-border text-muted-foreground">
                                              {typeof part.output ===
                                              "string" ? (
                                                toolName === "scrapeWebpage" ? (
                                                  <div className="flex flex-col gap-2">
                                                    <span className="text-muted-foreground font-medium">
                                                      Scraped{" "}
                                                      {typeof part.input ===
                                                        "object" &&
                                                      part.input !== null &&
                                                      "url" in part.input &&
                                                      typeof part.input.url ===
                                                        "string" ? (
                                                        <Link
                                                          href={part.input.url}
                                                          target="_blank"
                                                          rel="noopener"
                                                          className="text-primary"
                                                        >
                                                          {part.input.url}
                                                        </Link>
                                                      ) : (
                                                        "Unknown URL"
                                                      )}
                                                    </span>
                                                    <MarkdownRenderer
                                                      animated={{
                                                        animation: "blurIn",
                                                        duration: 250,
                                                        easing: "ease-out",
                                                      }}
                                                      isAnimating={
                                                        status ===
                                                          "streaming" &&
                                                        isLatestMsg &&
                                                        isLatestPart
                                                      }
                                                      className="text-muted-foreground"
                                                    >
                                                      {part.output}
                                                    </MarkdownRenderer>
                                                  </div>
                                                ) : part.output.trim() ? (
                                                  toolName === "searchWeb" ? (
                                                    <div className="flex flex-col gap-2">
                                                      <span className="text-muted-foreground font-medium">
                                                        Searched for{" "}
                                                        {typeof part.input ===
                                                          "object" &&
                                                        part.input !== null &&
                                                        "query" in part.input &&
                                                        typeof part.input
                                                          .query === "string"
                                                          ? `"${part.input.query}"`
                                                          : "unknown query"}
                                                      </span>
                                                      <p className="text-muted-foreground">
                                                        {part.output}
                                                      </p>
                                                    </div>
                                                  ) : (
                                                    part.output
                                                  )
                                                ) : (
                                                  <span className="italic">
                                                    No output
                                                  </span>
                                                )
                                              ) : part.output ? (
                                                JSON.stringify(part.output)
                                              ) : (
                                                "No output"
                                              )}
                                            </CollapsibleContent>
                                          </Collapsible>
                                        );
                                      case "output-error":
                                        return (
                                          <div
                                            key={part.toolCallId}
                                            className="flex items-center gap-2"
                                          >
                                            <Icon className="text-destructive size-4.5" />
                                            <span className="text-base font-medium text-destructive">
                                              {error} failed
                                            </span>
                                          </div>
                                        );
                                    }
                                  }
                                })}
                          </BubbleContent>
                          {msg.role === "user" && msg.metadata?.createdAt && (
                            <MessageFooter>
                              Sent at {format(msg.metadata.createdAt, "p")}{" "}
                              {isSameDay(new Date(), msg.metadata.createdAt)
                                ? "earlier today"
                                : format(msg.metadata.createdAt, " 'on' PP")}
                            </MessageFooter>
                          )}
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                );
              })}
              {error && (
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

                    <MessageContent className="flex flex-col gap-0.5 p-4 bg-destructive/10 border border-destructive/75">
                      <h4 className="text-xl font-medium text-destructive">
                        An error occurred
                      </h4>
                      <p className="text-base text-destructive">
                        We were unable to generate your output. Try again or
                        come back later if the issue persists.
                      </p>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              )}
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
        isPending={status === "submitted" || status === "streaming"}
      />
    </div>
  );
};
