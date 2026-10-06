"use client";

import { InfiniteScrollError } from "@/components/infinite-scroll-error";

import { ChatSelectType } from "@/db/schema";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { DEFAULT_PAGE } from "@/lib/constants";
import { useDialogStateStore } from "@/store/use-dialog-state-store";
import { JSX, ReactNode, useCallback, useEffect, useState } from "react";
import { readChatsAction } from "./actions/actions";

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
  const [query, setQuery] = useState(useSearch ? search : "");

  useEffect(() => {
    const timer = setTimeout(() => setQuery(useSearch ? search : ""), 250);
    return () => clearTimeout(timer);
  }, [search, useSearch]);

  const fetchChats = useCallback(
    (nextPage: number) => {
      return readChatsAction(userId, {
        search: useSearch ? query : undefined,
        page: nextPage,
      });
    },
    [userId, useSearch, query],
  );

  const {
    items: chats,
    error,
    retry,
    setSentinelEl,
    setContainerEl,
    isPending,
    hasNextPage,
  } = useInfiniteScroll<ChatSelectType, "chats">(
    useSearch ? [] : initialChats,
    useSearch ? true : initialHasNextPage,
    fetchChats,
    {
      resetKey: JSON.stringify([userId, useSearch, query]),
      defaultPage: useSearch ? DEFAULT_PAGE - 1 : DEFAULT_PAGE,
      enabled: !useSearch || search === query,
    },
  );

  return (
    <div
      ref={setContainerEl}
      className="flex flex-col w-full min-w-0 min-h-0 h-full flex-1 gap-2"
    >
      {!chats.length && !isPending && !hasNextPage && (
        <span className="py-2 text-center text-sm text-muted-foreground">
          No chats found
        </span>
      )}
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
      <InfiniteScrollError error={error} retry={retry} />
      <div ref={setSentinelEl} className="w-full h-1 bg-transparent" />
    </div>
  );
};
