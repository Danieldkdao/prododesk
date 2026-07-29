"use client";

import { ChatSelectType } from "@/db/schema";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { DEFAULT_PAGE } from "@/lib/constants";
import { useDialogStateStore } from "@/store/use-dialog-state-store";
import { JSX, ReactNode, useCallback, useEffect } from "react";
import { getChatsAction } from "./actions/actions";

export const InfiniteChatList = ({
  userId,
  useSearch,
  initialChats,
  initialHasNextPage,
  ChatItem,
  skeleton,
}: {
  userId: string;
  useSearch: boolean;
  initialChats: ChatSelectType[];
  initialHasNextPage: boolean;
  ChatItem: (chat: ChatSelectType) => JSX.Element;
  skeleton: ReactNode;
}) => {
  const search = useDialogStateStore((state) => state.search);

  const fetchChats = useCallback(
    (nextPage: number) => {
      return getChatsAction(userId, {
        search: useSearch ? search : undefined,
        page: nextPage,
      });
    },
    [userId, useSearch, search],
  );

  const {
    items: chats,
    setItems: setChats,
    setHasNextPage,
    setSentinelEl,
    setContainerEl,
    isPending,
    setPage,
    startTransition,
  } = useInfiniteScroll<ChatSelectType, "chats">(
    initialChats,
    initialHasNextPage,
    fetchChats,
    {
      additionalScrollDeps: [search, useSearch, userId],
    },
  );

  useEffect(() => {
    if (!useSearch) return;

    let cancelled = false;

    setPage(DEFAULT_PAGE);

    startTransition(async () => {
      const { chats, metadata } = await getChatsAction(userId, {
        search,
        page: DEFAULT_PAGE,
      });

      if (cancelled) return;

      setChats(chats);
      setHasNextPage(metadata.hasNextPage);
    });

    return () => {
      cancelled = true;
    };
  }, [
    search,
    useSearch,
    userId,
    setChats,
    setHasNextPage,
    setPage,
    startTransition,
  ]);

  return chats.length ? (
    <div
      ref={setContainerEl}
      className="flex flex-col w-full min-w-0 min-h-0 h-full flex-1 gap-2"
    >
      {chats.map((chat) => (
        <div key={chat.id} className="min-w-0 w-full">
          {ChatItem(chat)}
        </div>
      ))}
      {isPending &&
        Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="w-full">
            {skeleton}
          </div>
        ))}
      <div ref={setSentinelEl} className="w-full h-1 bg-transparent" />
    </div>
  ) : (
    <div className="w-full h-full min-h-0 flex-1 min-w-0 flex items-center justify-center">
      <span className="text-sm text-center text-muted-foreground font-medium py-2">
        No chats found
      </span>
    </div>
  );
};
