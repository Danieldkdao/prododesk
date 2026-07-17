"use client";

import { AILoadingAnimation } from "@/components/ai-loading-animation";
import { SimpleIcon } from "@/components/simple-icon";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
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
import { UserAvatar } from "@/components/user-avatar";
import { ModelId } from "@/db/shared";
import { useAuthSession } from "@/hooks/use-auth-session";
import { getModelInfo } from "@/services/ai/models";

export const PendingChatMessagesView = ({
  prompt,
  selectedModel,
}: {
  prompt: string;
  selectedModel: ModelId | null;
}) => {
  const { data: session } = useAuthSession();
  const modelInfo = getModelInfo(selectedModel);

  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="flex-1 min-h-0 w-full">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            <MessageScrollerItem>
              <Message align="end">
                <MessageAvatar>
                  <UserAvatar
                    name={session?.user.name ?? "You"}
                    image={session?.user.image}
                    className="size-10"
                  />
                </MessageAvatar>

                <MessageContent>
                  <Bubble variant="secondary" align="start">
                    <BubbleContent className="text-lg">{prompt}</BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            </MessageScrollerItem>
            <MessageScrollerItem>
              <Message align="start">
                <MessageAvatar>
                  <div className="size-10 shrink-0 rounded-full bg-muted flex items-center justify-center">
                    {modelInfo ? (
                      <SimpleIcon {...modelInfo.logo} />
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
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
};
