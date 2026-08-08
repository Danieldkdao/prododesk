import { DEFAULT_PAGE } from "@/lib/constants";
import { SetterType } from "@/lib/types";
import { useEffect, useRef, useState, useTransition } from "react";

type Options<T> = {
  rootMargin?: string;
  defaultPage?: number;
  additionalScrollDeps?: unknown[];
  resetKey?: string;
  ownState?: {
    values: T[];
    setValues: SetterType<T[]>;
  };
};

export const useInfiniteScroll = <T, K extends string>(
  initialItems: T[],
  initialHasNextPage: boolean,
  fetchData: (nextPage: number) => Promise<
    | (Record<Exclude<K, "metadata">, T[]> & {
        metadata: { hasNextPage: boolean };
      })
    | null
  >,
  {
    rootMargin = "400px",
    defaultPage = DEFAULT_PAGE,
    resetKey,
    additionalScrollDeps = [],
    ownState = undefined,
  }: Options<T> = {},
) => {
  const loadingRef = useRef(false);

  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);

  const [items, setItems] = useState(initialItems);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [page, setPage] = useState(defaultPage ?? DEFAULT_PAGE);
  const [isPending, startTransition] = useTransition();

  const itemsToUse = ownState?.values ?? items;
  const setterToUse = ownState?.setValues ?? setItems;

  const scrollDeps = [
    containerEl,
    fetchData,
    hasNextPage,
    isPending,
    page,
    rootMargin,
    sentinelEl,
  ];
  const finalScrollDeps = additionalScrollDeps?.length
    ? [...scrollDeps, ...additionalScrollDeps]
    : scrollDeps;

  useEffect(() => {
    loadingRef.current = false;
    setPage(defaultPage);
    setHasNextPage(initialHasNextPage);
    setterToUse(initialItems);
  }, [resetKey]);

  useEffect(() => {
    if (!sentinelEl || isPending || !hasNextPage) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || loadingRef.current) return;

        loadingRef.current = true;

        try {
          const nextPage = page + 1;

          const response = await fetchData(nextPage);
          if (!response) {
            setHasNextPage(false);
            return;
          }

          const { metadata, ...rest } = response;

          const items = Object.values(rest)
            .filter((value): value is T[] => Array.isArray(value))
            .flat();

          startTransition(() => {
            setterToUse((prev) => [...prev, ...items]);
            setHasNextPage(metadata.hasNextPage);
            setPage(nextPage);
          });
        } finally {
          loadingRef.current = false;
        }
      },
      {
        root: containerEl ?? undefined,
        rootMargin,
      },
    );

    observer.observe(sentinelEl);

    return () => observer.disconnect();
  }, finalScrollDeps);

  return {
    items: itemsToUse,
    setItems: setterToUse,
    setContainerEl,
    setSentinelEl,
    isPending,
    startTransition,
    page,
    setPage,
    hasNextPage,
    setHasNextPage,
  };
};
