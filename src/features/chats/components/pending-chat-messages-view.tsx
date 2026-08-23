"use client";

import { AILoadingAnimation } from "@/components/ai-loading-animation";
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
import { TextShimmer } from "@/components/ui/text-shimmer";
import { UserAvatar } from "@/components/user-avatar";
import { useAuthSession } from "@/hooks/use-auth-session";
import Image from "next/image";

export const PendingChatMessagesView = ({ prompt }: { prompt: string }) => {
  const { data: session } = useAuthSession();

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
                    <div className="relative size-7 rounded-full shrink-0">
                      <Image
                        src="/logo.png"
                        alt="AI"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </MessageAvatar>

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
