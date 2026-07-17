"use client";

import { ChatTableSelectType } from "@/db/schema";
import { DEFAULT_PAGE } from "@/lib/constants";
import { useDialogStateStore } from "@/store/use-dialog-state-store";
import {
  JSX,
  ReactNode,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
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
  initialChats: ChatTableSelectType[];
  initialHasNextPage: boolean;
  ChatItem: (chat: ChatTableSelectType) => JSX.Element;
  skeleton: ReactNode;
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [chats, setChats] = useState(initialChats);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [isPending, startTransition] = useTransition();

  const search = useDialogStateStore((state) => state.search);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isPending || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startTransition(async () => {
          const nextPage = page + 1;

          const { chats, metadata } = await getChatsAction(userId, {
            search: useSearch ? search : undefined,
            page: nextPage,
          });

          setChats((prev) => [...prev, ...chats]);
          setHasNextPage(metadata.hasNextPage);
          setPage(nextPage);
        });
      },
      {
        root: containerRef.current,
        rootMargin: "400px",
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasNextPage, isPending, page, search, useSearch, userId]);

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
  }, [search, useSearch, userId]);

  return chats.length ? (
    <div
      ref={containerRef}
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
      <div ref={sentinelRef} className="w-full h-1 bg-transparent" />
    </div>
  ) : (
    <div className="w-full h-full min-h-0 flex-1 min-w-0 flex items-center justify-center">
      <span className="text-sm text-center text-muted-foreground font-medium py-2">
        No chats found
      </span>
    </div>
  );
};
