import { DEFAULT_PAGE } from "@/lib/constants";
import { SetterType } from "@/lib/types";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";

type Options<T> = {
  rootMargin?: string;
  defaultPage?: number;
  additionalScrollDeps?: unknown[];
  resetKey?: string;
  enabled?: boolean;
  ownState?: { values: T[]; setValues: SetterType<T[]> };
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
    enabled = true,
    ownState,
  }: Options<T> = {},
) => {
  const generationRef = useRef(0);
  const requestRef = useRef<symbol | null>(null);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);
  const [items, setItems] = useState(initialItems);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [page, setPage] = useState(defaultPage);
  const [previousResetKey, setPreviousResetKey] = useState(resetKey);
  const [requestState, setRequestState] = useState<{
    fetchData: typeof fetchData;
    resetKey: typeof resetKey;
    enabled: boolean;
    isLoading: boolean;
    error: string | null;
  }>({ fetchData, resetKey, enabled, isLoading: false, error: null });
  const [isTransitionPending, startTransition] = useTransition();
  const setterToUse = ownState?.setValues ?? setItems;
  const isCurrentScope =
    requestState.fetchData === fetchData &&
    requestState.resetKey === resetKey &&
    requestState.enabled === enabled;
  const isLoading = isCurrentScope && requestState.isLoading;
  const error = isCurrentScope ? requestState.error : null;
  const resetOwnedItems = useEffectEvent(() => {
    ownState?.setValues(initialItems);
  });

  if (previousResetKey !== resetKey) {
    setPreviousResetKey(resetKey);
    setItems(initialItems);
    setPage(defaultPage);
    setHasNextPage(initialHasNextPage);
  }

  if (
    !isCurrentScope &&
    (requestState.isLoading || requestState.error !== null)
  ) {
    setRequestState({
      fetchData,
      resetKey,
      enabled,
      isLoading: false,
      error: null,
    });
  }

  useLayoutEffect(() => {
    generationRef.current += 1;
    requestRef.current = null;
    return () => {
      generationRef.current += 1;
      requestRef.current = null;
    };
  }, [fetchData, resetKey, enabled]);

  useLayoutEffect(() => {
    resetOwnedItems();
  }, [resetKey]);

  const loadMore = useCallback(
    async (retry = false) => {
      if (!enabled || requestRef.current || !hasNextPage || (error && !retry))
        return;
      const token = Symbol();
      const generation = generationRef.current;
      requestRef.current = token;
      setRequestState({
        fetchData,
        resetKey,
        enabled,
        isLoading: true,
        error: null,
      });
      const isCurrent = () =>
        generation === generationRef.current && requestRef.current === token;
      try {
        const nextPage = page + 1;
        const response = await fetchData(nextPage);
        if (!isCurrent()) return;
        if (!response)
          throw new Error("Unable to load more items. Please try again.");
        const { metadata, ...rest } = response;
        const nextItems = Object.values(rest)
          .filter((value): value is T[] => Array.isArray(value))
          .flat();
        setterToUse((previous) => [...previous, ...nextItems]);
        setHasNextPage(metadata.hasNextPage);
        setPage(nextPage);
      } catch {
        if (isCurrent())
          setRequestState({
            fetchData,
            resetKey,
            enabled,
            isLoading: false,
            error: "Unable to load more items. Please try again.",
          });
      } finally {
        if (isCurrent()) {
          requestRef.current = null;
          setRequestState((current) => ({ ...current, isLoading: false }));
        }
      }
    },
    [enabled, error, fetchData, hasNextPage, page, resetKey, setterToUse],
  );

  useEffect(() => {
    if (!sentinelEl || !enabled || isLoading || error || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadMore();
      },
      { root: containerEl ?? undefined, rootMargin },
    );
    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [
    containerEl,
    enabled,
    error,
    hasNextPage,
    isLoading,
    loadMore,
    rootMargin,
    sentinelEl,
  ]);

  return {
    items: ownState?.values ?? items,
    setItems: setterToUse,
    setContainerEl,
    setSentinelEl,
    isPending: isLoading || isTransitionPending,
    error,
    retry: () => {
      void loadMore(true);
    },
    startTransition,
    page,
    setPage,
    hasNextPage,
    setHasNextPage,
  };
};
