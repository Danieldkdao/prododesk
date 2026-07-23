"use client";

import { CopyButton } from "@/components/animate-ui/components/buttons/copy";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/animate-ui/primitives/base/collapsible";
import {
  markdownAnimateOptions,
  MarkdownRenderer,
} from "@/components/markdown/markdown-renderer";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message";
import { MessageScrollerItem } from "@/components/ui/message-scroller";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { UserAvatar } from "@/components/user-avatar";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useChatProvider } from "@/hooks/use-chat-provider";
import { cn, formatMs } from "@/lib/utils";
import { RegenerateButton } from "@/services/ai/components/regenerate-button";
import { getModelInfo } from "@/services/ai/models";
import { ToolName } from "@/services/ai/tool-contracts";
import { CustomUIMessage } from "@/services/ai/types";
import { getToolName, isToolUIPart } from "ai";
import { format, isSameDay } from "date-fns";
import {
  BrainIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  HandIcon,
} from "lucide-react";
import Link from "next/link";
import {
  formatCurrentAction,
  formatToolNameForChat,
  getApprovalReason,
} from "../lib/formatters";

export const ChatViewListMessage = ({
  msg,
  messages,
  currentModelInfo,
}: {
  msg: CustomUIMessage;
  messages: CustomUIMessage[];
  currentModelInfo: ReturnType<typeof getModelInfo>;
}) => {
  const { data: session } = useAuthSession();
  const { id, addToolApprovalResponse, status, cancelledMessageIds } =
    useChatProvider();

  const messageContent = msg.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ");
  const latestUserMsg = messages.findLast((msg) => msg.role === "user");
  const modelInfo = getModelInfo(
    msg.metadata?.modelId ?? latestUserMsg?.metadata?.modelId,
  );
  const isLatestMsg = messages.at(-1)?.id === msg.id;
  const latestPart = msg.parts.at(-1);

  const responseTimeMs = msg.metadata?.responseTimeMs;

  const currentAction = formatCurrentAction(latestPart);

  return (
    <MessageScrollerItem
      messageId={msg.id}
      scrollAnchor={msg.role === "user"}
      className="group"
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
              {modelInfo ? (
                <modelInfo.logo
                  color={modelInfo.logoColor}
                  className="size-5"
                />
              ) : currentModelInfo ? (
                <currentModelInfo.logo
                  color={currentModelInfo.logoColor}
                  className="size-5"
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
            variant={
              msg.metadata?.runStatus === "failed"
                ? "destructive"
                : msg.role === "user"
                  ? "secondary"
                  : "ghost"
            }
          >
            {msg.metadata?.runStatus === "failed" ? (
              <BubbleContent>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-xl font-medium text-destructive">
                    An error occurred
                  </h4>
                  <p className="text-base text-destructive">
                    We were unable to generate your output. Try again or come
                    back later if the issue persists.
                  </p>
                  {msg.metadata.runError && (
                    <p className="text-base text-destructive">
                      {msg.metadata.runError
                        .split("")
                        .filter((l) => l !== '"')
                        .join("")}
                    </p>
                  )}
                </div>
              </BubbleContent>
            ) : (
              <BubbleContent className="text-lg flex flex-col gap-4 self-end">
                {msg.role === "user" ? (
                  messageContent
                ) : (
                  <div className="flex flex-col gap-4">
                    <Collapsible className="space-y-4 group">
                      <CollapsibleTrigger className="flex items-center gap-1.5 group/trigger">
                        {latestPart &&
                        isToolUIPart(latestPart) &&
                        latestPart.state === "approval-requested" &&
                        !latestPart.approval?.isAutomatic ? (
                          <>
                            <ClockIcon className="text-muted-foreground size-5" />
                            <TextShimmer
                              as="span"
                              duration={2}
                              className="text-lg font-medium [--base-color:var(--muted-foreground)]"
                            >
                              Awaiting approval
                            </TextShimmer>
                          </>
                        ) : cancelledMessageIds.has(msg.id) ||
                          msg.metadata?.runStatus === "cancelled" ? (
                          <>
                            <HandIcon className="text-muted-foreground size-5" />
                            <span className="text-lg text-muted-foreground font-medium">
                              You stopped this response
                            </span>
                          </>
                        ) : responseTimeMs !== undefined &&
                          responseTimeMs !== null ? (
                          <>
                            <span className="text-lg font-medium text-muted-foreground">
                              Worked for {formatMs(responseTimeMs)}
                            </span>
                            <ChevronRightIcon className="text-muted-foreground size-5 transition-all duration-200 group-data-panel-open/trigger:rotate-90" />
                          </>
                        ) : (
                          <>
                            <currentAction.icon className="size-5 text-muted-foreground" />
                            <TextShimmer
                              as="span"
                              duration={2}
                              className="text-lg font-medium [--base-color:var(--muted-foreground)]"
                            >
                              {currentAction.text}
                            </TextShimmer>
                          </>
                        )}
                      </CollapsibleTrigger>
                      <CollapsiblePanel className="flex flex-col gap-4">
                        {msg.parts
                          .filter(
                            (part, index) =>
                              !(
                                part.type === "text" &&
                                index === msg.parts.length - 1
                              ),
                          )
                          .map((part, index) => {
                            const isLatestPart = index === msg.parts.length - 1;
                            if (part.type === "text") {
                              return (
                                <MarkdownRenderer
                                  key={`${msg.id}-text-${index}`}
                                  animated={markdownAnimateOptions}
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
                                    {status === "streaming" && isLatestPart ? (
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
                                  <CollapsiblePanel className="pl-4 border-l border-border">
                                    <MarkdownRenderer
                                      animated={markdownAnimateOptions}
                                      isAnimating={
                                        status === "streaming" &&
                                        isLatestMsg &&
                                        isLatestPart
                                      }
                                      className="text-muted-foreground"
                                    >
                                      {part.text}
                                    </MarkdownRenderer>
                                  </CollapsiblePanel>
                                </Collapsible>
                              );
                            }
                            if (isToolUIPart(part)) {
                              const toolName = getToolName(part) as ToolName;
                              const {
                                preparing,
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
                                      {`Preparing ${preparing}`}
                                    </TextShimmer>
                                  );
                                case "approval-requested":
                                  if (part.approval.isAutomatic) {
                                    return (
                                      <TextShimmer
                                        as="span"
                                        duration={2}
                                        className="text-base italic font-medium [--base-color:var(--muted-foreground)]"
                                        key={part.toolCallId}
                                      >
                                        {`Running ${preparing}`}
                                      </TextShimmer>
                                    );
                                  }
                                case "approval-responded":
                                  return part.approval.approved ? (
                                    <TextShimmer
                                      as="span"
                                      duration={2}
                                      className="text-base italic font-medium [--base-color:var(--muted-foreground)]"
                                      key={part.toolCallId}
                                    >
                                      {`Running ${preparing}`}
                                    </TextShimmer>
                                  ) : (
                                    <div
                                      className="flex items-center gap-2"
                                      key={part.toolCallId}
                                    >
                                      <CircleXIcon className="text-muted-foreground size-5" />
                                      <span className="text-muted-foreground text-base">
                                        You denied the agent to run {preparing}
                                      </span>
                                    </div>
                                  );
                                case "output-available":
                                  return (
                                    <Collapsible
                                      key={part.toolCallId}
                                      className="flex flex-col gap-2"
                                    >
                                      <CollapsibleTrigger className="flex flex-col gap-4 cursor-pointer">
                                        {part.approval?.approved && (
                                          <div
                                            className="flex items-center gap-2"
                                            key={part.toolCallId}
                                          >
                                            <CircleCheckIcon className="text-muted-foreground size-5" />
                                            <span className="text-muted-foreground text-base font-medium">
                                              You approved the agent to run{" "}
                                              {preparing}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                          <Icon className="text-muted-foreground size-4.5" />
                                          <span className="text-base font-medium text-muted-foreground">
                                            Finished {finished}
                                          </span>
                                        </div>
                                      </CollapsibleTrigger>
                                      <CollapsiblePanel className="pl-4 border-l border-border text-muted-foreground">
                                        {typeof part.output === "string" ? (
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
                                                animated={
                                                  markdownAnimateOptions
                                                }
                                                isAnimating={
                                                  status === "streaming" &&
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
                                                  typeof part.input.query ===
                                                    "string"
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
                                      </CollapsiblePanel>
                                    </Collapsible>
                                  );
                                case "output-denied":
                                  return (
                                    <div
                                      className="flex items-center gap-2"
                                      key={part.toolCallId}
                                    >
                                      <CircleXIcon className="text-muted-foreground size-5" />
                                      <span className="text-muted-foreground text-base">
                                        You denied the agent to run {preparing}
                                      </span>
                                    </div>
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
                      </CollapsiblePanel>
                    </Collapsible>
                    {latestPart &&
                      isToolUIPart(latestPart) &&
                      latestPart.state === "approval-requested" &&
                      !latestPart.approval?.isAutomatic && (
                        <div className="flex flex-col gap-2">
                          <span className="text-muted-foreground font-medium text-base">
                            {getApprovalReason(latestPart.input)}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() =>
                                addToolApprovalResponse({
                                  id: latestPart.approval.id,
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
                                  id: latestPart.approval.id,
                                  approved: false,
                                })
                              }
                            >
                              Deny
                            </Button>
                          </div>
                        </div>
                      )}
                    {latestPart?.type === "text" && (
                      <MarkdownRenderer
                        animated={markdownAnimateOptions}
                        isAnimating={status === "streaming" && isLatestMsg}
                      >
                        {latestPart?.type === "text"
                          ? latestPart.text
                          : "No output"}
                      </MarkdownRenderer>
                    )}
                  </div>
                )}
              </BubbleContent>
            )}

            {(msg.role === "user" ||
              (msg.role === "assistant" &&
                (status === "ready" || status === "error"))) && (
              <MessageFooter
                className={cn(
                  "flex items-center gap-2",
                  msg.role === "user" &&
                    "opacity-0 group-hover:opacity-100 transition-all duration-200",
                )}
              >
                {msg.role === "user" && msg.metadata?.createdAt && (
                  <span className="text-muted-foreground">
                    Sent at {format(msg.metadata.createdAt, "p")}{" "}
                    {isSameDay(new Date(), msg.metadata.createdAt)
                      ? "earlier today"
                      : format(msg.metadata.createdAt, " 'on' PP")}
                  </span>
                )}
                {msg.metadata?.runStatus !== "failed" && (
                  <TooltipWrapper content="Copy">
                    <CopyButton
                      content={messageContent}
                      variant="ghost"
                      size="sm"
                    />
                  </TooltipWrapper>
                )}
                {msg.role === "assistant" && isLatestMsg && (
                  <RegenerateButton
                    id={msg.id}
                    chatId={msg.metadata?.chatId ?? id}
                    modelId={
                      msg.metadata?.modelId ?? currentModelInfo?.id ?? undefined
                    }
                    responseToClientId={
                      msg.metadata?.responseToClientId ?? latestUserMsg?.id
                    }
                  />
                )}
              </MessageFooter>
            )}
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
};
