"use client";

import { useChatProvider } from "@/hooks/use-chat-provider";
import { PendingChatView } from "./pending-chat-view";
import { Skeleton } from "@/components/ui/skeleton";

export const ChatViewRealSkeleton = () => {
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-8">
      <span className="sr-only">Loading chat messages...</span>
      <div className="min-w-0 flex-1">
        <Skeleton className="h-8 w-64 max-w-[70%] rounded-none" />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Skeleton className="size-9 rounded-none" />
        <Skeleton className="size-9 rounded-none" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0 flex-col gap-8 overflow-hidden">
          <div className="flex w-full min-w-0 flex-row-reverse gap-2">
            <Skeleton className="size-10 shrink-0 rounded-full" />

            <div className="flex min-w-0 max-w-[80%] flex-col items-end gap-2.5">
              <Skeleton className="h-12 w-64 max-w-full rounded-none" />
              <Skeleton className="h-3 w-28 rounded-none" />
            </div>
          </div>
          <div className="flex w-full min-w-0 gap-2">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex w-full min-w-0 flex-col gap-2.5">
              <div className="flex w-[72%] max-w-[80%] flex-col gap-2 bg-secondary px-4 py-3">
                <Skeleton className="h-4 w-[92%] rounded-none bg-muted-foreground/15" />
                <Skeleton className="h-4 w-full rounded-none bg-muted-foreground/15" />
                <Skeleton className="h-4 w-[75%] rounded-none bg-muted-foreground/15" />
              </div>
            </div>
          </div>
          <div className="flex w-full min-w-0 flex-row-reverse gap-2">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex min-w-0 max-w-[80%] flex-col items-end gap-2.5">
              <Skeleton className="h-16 w-80 max-w-full rounded-none" />
              <Skeleton className="h-3 w-32 rounded-none" />
            </div>
          </div>
          <div className="flex w-full min-w-0 gap-2">
            <Skeleton className="size-10 shrink-0 rounded-full" />

            <div className="flex w-full min-w-0 flex-col gap-2.5">
              <div className="flex w-[65%] max-w-[80%] flex-col gap-2 bg-secondary px-4 py-3">
                <Skeleton className="h-4 w-full rounded-none bg-muted-foreground/15" />
                <Skeleton className="h-4 w-[85%] rounded-none bg-muted-foreground/15" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 border p-2">
        <Skeleton className="size-8 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 px-1">
          <Skeleton className="h-5 w-48 max-w-full rounded-none" />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </div>
    </div>
  );
};

export const ChatViewSkeleton = () => {
  const { messages, selectedModel, queuedMessage } = useChatProvider();

  const latestPrompt = messages
    .filter((message) => message.role === "user")
    .at(-1)
    ?.parts.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  const prompt = queuedMessage?.prompt ?? latestPrompt;
  const model = queuedMessage?.selectedModel ?? selectedModel;

  if (prompt && model) {
    return <PendingChatView prompt={prompt} selectedModel={model} />;
  }

  return <ChatViewRealSkeleton />;
};
