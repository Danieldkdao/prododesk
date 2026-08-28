import { AILoadingAnimation } from "@/components/ai-loading-animation";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
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
import { FileAttachment } from "@/services/ai/types";
import { ChatMessageAttachments } from "./chat-message-attachments";

export const PendingChatMessagesView = ({
  prompt,
  attachments,
}: {
  prompt: string;
  attachments?: FileAttachment[];
}) => {
  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="flex-1 min-h-0 w-full">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            <MessageScrollerItem>
              <Message align="end">
                <MessageContent className="w-full @2xl:max-w-4/5 @container flex flex-col gap-4">
                  {attachments?.length ? (
                    <ChatMessageAttachments attachments={attachments} />
                  ) : null}
                  <Bubble variant="secondary" align="start">
                    <BubbleContent className="text-lg">{prompt}</BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            </MessageScrollerItem>
            <MessageScrollerItem>
              <Message align="start">
                <MessageContent className="flex flex-col gap-0.5 h-15">
                  <TextShimmer
                    duration={2}
                    as="span"
                    className="text-base italic font-medium [--base-color:var(--muted-foreground)]"
                  >
                    Prododesk AI is thinking...
                  </TextShimmer>
                  <AILoadingAnimation />
                </MessageContent>
              </Message>
            </MessageScrollerItem>
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
};
