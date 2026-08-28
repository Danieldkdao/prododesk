"use client";

import { CopyButton } from "@/components/animate-ui/components/buttons/copy";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/animate-ui/primitives/base/collapsible";
import { FileDisplay } from "@/components/file-display";
import {
  markdownAnimateOptions,
  StreamMarkdownRenderer,
} from "@/components/markdown/stream-markdown-renderer";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message";
import { MessageScrollerItem } from "@/components/ui/message-scroller";
import { TextShimmer } from "@/components/ui/text-shimmer";
import {
  formatActivityLink,
  formatActivitySubject,
  groupActivityBySubject,
} from "@/features/activity/lib/formatters";
import { useChatProvider } from "@/hooks/use-chat-provider";
import { cn, formatMs, generateFileUrl } from "@/lib/utils";
import { RegenerateButton } from "@/services/ai/components/regenerate-button";
import { getModelInfo } from "@/services/ai/models";
import { ToolName } from "@/services/ai/tool-contracts";
import { CustomUIMessage, FileAttachment } from "@/services/ai/types";
import { getToolName, isToolUIPart } from "ai";
import { format, isSameDay } from "date-fns";
import {
  BrainIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  GemIcon,
  HandIcon,
} from "lucide-react";
import Link from "next/link";
import {
  formatCurrentAction,
  formatToolNameForChat,
  getApprovalReason,
} from "../lib/formatters";
import { ChatMessageAttachments } from "./chat-message-attachments";

export const ChatViewListMessage = ({
  msg,
  messages,
  currentModelInfo,
}: {
  msg: CustomUIMessage;
  messages: CustomUIMessage[];
  currentModelInfo: ReturnType<typeof getModelInfo>;
}) => {
  const { id, addToolApprovalResponse, status, cancelledMessageIds } =
    useChatProvider();

  const messageContent = msg.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ");
  const latestUserMsg = messages.findLast((message) => message.role === "user");
  const isLatestMsg = messages.at(-1)?.id === msg.id;
  const latestPart = msg.parts.at(-1);

  const responseTimeMs = msg.metadata?.responseTimeMs;
  const artifacts = msg.metadata?.artifacts;

  const fileParts = msg.parts.filter((part) => part.type === "file");
  const attachments = fileParts.length
    ? fileParts.map((part) => ({
        type: "file" as const,
        filename: part.filename || "Unknown file",
        mediaType: part.mediaType || "application/octet-stream",
        url: part.url,
        providerMetadata: {
          prododesk: {
            uploadId: String(part.providerMetadata?.prododesk?.uploadId) || "",
          },
        } as const,
      }))
    : msg.metadata?.attachments
      ? msg.metadata?.attachments.map((attachment) => ({
          type: "file" as const,
          filename: attachment.fileName,
          mediaType: attachment.fileType,
          url: generateFileUrl(attachment.storageKey),
          providerMetadata: {
            prododesk: {
              uploadId: attachment.id,
            },
          },
        }))
      : [];

  const currentAction = formatCurrentAction(latestPart);

  const pendingApprovals = msg.parts.filter(
    (part) =>
      isToolUIPart(part) &&
      part.state === "approval-requested" &&
      !part.approval.isAutomatic,
  );
  const pendingApproval = pendingApprovals[0];
  const isAwaitingApproval = pendingApprovals.length > 0;

  return (
    <MessageScrollerItem messageId={msg.id} className="group">
      <Message
        align={msg.role === "user" ? "end" : "start"}
        className="@container"
      >
        <MessageContent className="w-full @2xl:max-w-4/5 @container flex flex-col gap-4">
          {attachments?.length ? (
            <ChatMessageAttachments attachments={attachments} />
          ) : null}
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
                      <CollapsibleTrigger className="group/trigger flex items-center gap-1.5">
                        {responseTimeMs != null &&
                        ((!isAwaitingApproval && status === "ready") ||
                          !isLatestMsg) ? (
                          <>
                            <span className="text-lg font-medium text-muted-foreground">
                              Worked for {formatMs(responseTimeMs)}
                            </span>
                            <ChevronRightIcon className="size-5 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 group-data-panel-open/trigger:rotate-90" />
                          </>
                        ) : pendingApproval &&
                          isToolUIPart(pendingApproval) &&
                          pendingApproval.state === "approval-requested" &&
                          !pendingApproval.approval?.isAutomatic ? (
                          <>
                            <ClockIcon className="size-5 text-muted-foreground" />
                            <TextShimmer
                              as="span"
                              duration={2}
                              className="text-lg font-medium [--base-color:var(--muted-foreground)]"
                            >
                              {`Awaiting your approval to run ${
                                formatToolNameForChat(
                                  getToolName(pendingApproval) as ToolName,
                                ).preparing
                              }`}
                            </TextShimmer>
                          </>
                        ) : cancelledMessageIds.has(msg.id) ||
                          msg.metadata?.runStatus === "cancelled" ? (
                          <>
                            <HandIcon className="size-5 text-muted-foreground" />
                            <span className="text-lg font-medium text-muted-foreground">
                              You stopped this response
                            </span>
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
                            <ChevronRightIcon className="size-5 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 group-data-panel-open/trigger:rotate-90" />
                          </>
                        )}
                      </CollapsibleTrigger>
                      <CollapsiblePanel>
                        <div className="max-h-[min(50rem,60vh)] overflow-y-auto overscroll-contain pr-2 scroll-fade scrollbar-none">
                          <div className="flex flex-col gap-4">
                            {msg.parts
                              .map((part, index) => ({ part, index }))
                              .filter(
                                ({ part, index }) =>
                                  !(
                                    part.type === "text" &&
                                    index === msg.parts.length - 1
                                  ),
                              )
                              .map(({ part, index }) => {
                                const isLatestPart =
                                  index === msg.parts.length - 1;
                                if (part.type === "text") {
                                  return (
                                    <StreamMarkdownRenderer
                                      key={`${msg.id}-text-${index}`}
                                      animated={markdownAnimateOptions}
                                      isAnimating={
                                        status === "streaming" &&
                                        isLatestMsg &&
                                        isLatestPart
                                      }
                                    >
                                      {part.text}
                                    </StreamMarkdownRenderer>
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
                                      <CollapsiblePanel className="pl-4 border-l border-border">
                                        <StreamMarkdownRenderer
                                          animated={markdownAnimateOptions}
                                          isAnimating={
                                            status === "streaming" &&
                                            isLatestMsg &&
                                            isLatestPart
                                          }
                                          className="text-muted-foreground"
                                        >
                                          {part.text}
                                        </StreamMarkdownRenderer>
                                      </CollapsiblePanel>
                                    </Collapsible>
                                  );
                                }
                                if (isToolUIPart(part)) {
                                  const toolName = getToolName(
                                    part,
                                  ) as ToolName;
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
                                      return part.approval.isAutomatic ? (
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
                                          <ClockIcon className="text-muted-foreground size-5" />
                                          <TextShimmer
                                            as="span"
                                            duration={2}
                                            className="text-base font-medium [--base-color:var(--muted-foreground)]"
                                          >
                                            {`Awaiting your approval to run ${preparing}`}
                                          </TextShimmer>
                                        </div>
                                      );
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
                                            You denied the agent to run{" "}
                                            {preparing}
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
                                                  <StreamMarkdownRenderer
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
                                                  </StreamMarkdownRenderer>
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
                                              <p className="text-muted-foreground">
                                                {JSON.stringify(part.output)}
                                              </p>
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
                                            You denied the agent to run{" "}
                                            {preparing}
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
                          </div>
                        </div>
                      </CollapsiblePanel>
                    </Collapsible>
                    {pendingApproval &&
                      isToolUIPart(pendingApproval) &&
                      pendingApproval.state === "approval-requested" &&
                      !pendingApproval.approval?.isAutomatic && (
                        <div className="flex flex-col gap-2">
                          <span className="text-muted-foreground font-medium text-base">
                            {getApprovalReason(pendingApproval)}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() =>
                                addToolApprovalResponse({
                                  id: pendingApproval.approval.id,
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
                                  id: pendingApproval.approval.id,
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
                      <StreamMarkdownRenderer
                        animated={markdownAnimateOptions}
                        isAnimating={status === "streaming" && isLatestMsg}
                      >
                        {latestPart?.type === "text"
                          ? latestPart.text
                          : "No output"}
                      </StreamMarkdownRenderer>
                    )}

                    {artifacts?.length ? (
                      <Collapsible className="group flex flex-col gap-4">
                        <CollapsibleTrigger className="flex items-center gap-2 group/trigger">
                          <GemIcon className="text-muted-foreground size-4" />
                          <span className="text-muted-foreground text-base font-medium">
                            {artifacts.length}{" "}
                            {artifacts.length === 1 ? "artifact" : "artifacts"}
                          </span>
                          <ChevronRightIcon className="size-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 group-data-panel-open/trigger:rotate-90" />
                        </CollapsibleTrigger>
                        <CollapsiblePanel className="flex flex-col gap-4">
                          {groupActivityBySubject(artifacts).map(
                            ([subject, subArtifacts]) => (
                              <div
                                key={subject}
                                className="flex flex-col gap-2"
                              >
                                <span className="text-base font-medium">
                                  {formatActivitySubject(subject).label + "s"}
                                </span>
                                <div className="flex items-center gap-4 flex-wrap max-w-200 w-full">
                                  {subArtifacts.map((artifact) => {
                                    if (!artifact.activity) return null;

                                    const activitySubject =
                                      artifact.activity.subject;

                                    const { icon: SubjectIcon } =
                                      formatActivitySubject(activitySubject);

                                    return (
                                      <Link
                                        key={artifact.activityId}
                                        href={formatActivityLink(
                                          artifact.activity,
                                        )}
                                        target="_blank"
                                      >
                                        <div className="flex items-center gap-2 px-2 py-0.5 bg-primary/10 text-primary">
                                          <SubjectIcon className="size-5" />
                                          <span className="text-base font-medium">
                                            {artifact.activity.subjectLabel}
                                          </span>
                                        </div>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            ),
                          )}
                        </CollapsiblePanel>
                      </Collapsible>
                    ) : null}
                  </div>
                )}
              </BubbleContent>
            )}

            {(msg.role === "user" ||
              (msg.role === "assistant" &&
                (status === "ready" || status === "error"))) &&
              !isAwaitingApproval && (
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
                        msg.metadata?.modelId ??
                        currentModelInfo?.id ??
                        undefined
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
