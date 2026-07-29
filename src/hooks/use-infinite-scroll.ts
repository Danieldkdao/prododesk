import { DEFAULT_PAGE } from "@/lib/constants";
import { useEffect, useState, useTransition } from "react";

type Options = {
  rootMargin?: `${number}px`;
  defaultPage?: number;
  additionalScrollDeps?: unknown[];
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
    additionalScrollDeps = [],
  }: Options = {},
) => {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);

  const [items, setItems] = useState(initialItems);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [page, setPage] = useState(defaultPage ?? DEFAULT_PAGE);
  const [isPending, startTransition] = useTransition();

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
    if (!sentinelEl || isPending || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startTransition(async () => {
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

          setItems((prev) => [...prev, ...items]);
          setHasNextPage(metadata.hasNextPage);
          setPage(nextPage);
        });
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
    items,
    setItems,
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
