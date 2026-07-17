import { AIChatInput } from "@/components/ai-chat-input";
import { ModelId } from "@/db/shared";
import { getModelInfo } from "@/services/ai/models";
import { PendingChatMessagesView } from "./pending-chat-messages-view";
import { ChatHeader } from "../chat-header";

export const PendingChatView = ({
  prompt,
  selectedModel,
}: {
  prompt: string;
  selectedModel: ModelId;
}) => {
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
          isPending
        />
      </div>
    </div>
  );
};
