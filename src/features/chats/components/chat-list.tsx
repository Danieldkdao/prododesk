import { getCurrentUser } from "@/lib/auth/helpers";
import { DEFAULT_PAGE } from "@/lib/constants";
import { ReactNode, Suspense } from "react";
import { getChatsAction } from "../actions/actions";
import {
  ChatListVariant,
  InfiniteChatListAdapter,
} from "./infinite-chat-list-adapter";

type Props = {
  variant: ChatListVariant;
  skeleton: ReactNode;
  useSearch?: boolean;
};

export const ChatList = (props: Props) => {
  return (
    <Suspense fallback={<ChatListLoading {...props} />}>
      <ChatListSuspense {...props} />
    </Suspense>
  );
};

const ChatListLoading = ({ skeleton }: { skeleton: ReactNode }) => {
  return (
    <div className="w-full min-w-0 flex flex-col gap-2 h-full min-h-0 flex-1">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index}>{skeleton}</div>
      ))}
    </div>
  );
};

const ChatListSuspense = async ({
  variant,
  useSearch = false,
  skeleton,
}: Props) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const { chats, metadata } = await getChatsAction(userId, {
    search: useSearch ? "" : undefined,
    page: DEFAULT_PAGE,
  });

  return (
    <InfiniteChatListAdapter
      key={chats.map((chat) => `${chat.id}-${chat.name}`).join("")}
      userId={userId}
      initialChats={chats}
      initialHasNextPage={metadata.hasNextPage}
      variant={variant}
      skeleton={skeleton}
      useSearch={useSearch}
    />
  );
};
