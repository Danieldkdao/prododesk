import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { getChatAction } from "@/features/chats/actions/actions";
import { ChatView } from "@/features/chats/components/chat-view";
import { ChatViewSkeleton } from "@/features/chats/components/chat-view-skeleton";
import { getCurrentUser } from "@/lib/auth/helpers";
import { ParamsId } from "@/lib/types";
import Link from "next/link";
import { Suspense } from "react";

type ChatIdParams = ParamsId<"chatId">;

const ChatIdPage = (props: ChatIdParams) => {
  return (
    <div className="w-full flex flex-col gap-8 h-full min-h-0 max-w-5xl mx-auto">
      <Suspense fallback={<ChatViewSkeleton />}>
        <ChatIdSuspense {...props} />
      </Suspense>
    </div>
  );
};

const ChatIdSuspense = async ({ params }: ChatIdParams) => {
  const { userId } = await getCurrentUser();

  if (!userId)
    return (
      <ErrorState
        title="Unauthorized"
        description="Hold on for a second. To continue onward, please sign in to the platform."
      >
        <Button
          variant="outline"
          render={<Link href="/sign-in">Sign in</Link>}
          className="w-full"
        />
      </ErrorState>
    );

  const { chatId } = await params;
  const chat = await getChatAction(userId, chatId);

  if (!chat) {
    return (
      <ErrorState
        title="404 Not Found"
        description="Looks like we were unable to find that chat. Make sure that the chat exists and wasn't deleted."
      />
    );
  }

  return <ChatView chat={chat} />;
};

export default ChatIdPage;
