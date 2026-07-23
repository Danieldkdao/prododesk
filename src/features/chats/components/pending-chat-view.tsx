"use client";

import { AIChatInput } from "@/components/ai-chat-input";
import { ModelId } from "@/services/ai/model-ids";
import { getModelInfo } from "@/services/ai/models";
import { ChatHeader } from "../chat-header";
import { PendingChatMessagesView } from "./pending-chat-messages-view";
import { useChatProvider } from "@/hooks/use-chat-provider";
import { useState } from "react";

export const PendingChatView = ({
  prompt,
  selectedModel,
}: {
  prompt: string;
  selectedModel: ModelId;
}) => {
  const { stop, sendQueuedMessage } = useChatProvider();
  const [isPending, setIsPending] = useState(true);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-8">
      <div className="shrink-0">
        <ChatHeader />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <PendingChatMessagesView
          prompt={prompt}
          selectedModel={selectedModel}
        />
      </div>

      <div className="shrink-0">
        <AIChatInput
          value=""
          onValueChange={() => {}}
          selectedModel={getModelInfo(selectedModel)}
          onSelectedModelChange={() => {}}
          onSubmit={() => {}}
          isPending={isPending}
          onStop={() => {
            sendQueuedMessage(null);
            stop();
            setIsPending(false);
          }}
        />
      </div>
    </div>
  );
};
