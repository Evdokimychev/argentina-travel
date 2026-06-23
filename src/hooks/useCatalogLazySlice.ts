"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UseCatalogLazySliceOptions = {
  /** When this value changes, visible count resets to pageSize. */
  resetKey: string;
  /** Root margin for IntersectionObserver (e.g. preload before sentinel enters viewport). */
  rootMargin?: string;
};

export function useCatalogLazySlice<T>(
  items: T[],
  pageSize: number,
  { resetKey, rootMargin = "320px 0px" }: UseCatalogLazySliceOptions,
) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [resetKey, pageSize]);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );

  const totalCount = items.length;
  const hasMore = visibleCount < totalCount;
  const remaining = totalCount - visibleCount;

  const loadMore = useCallback(() => {
    setVisibleCount((current) => Math.min(current + pageSize, totalCount));
  }, [pageSize, totalCount]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, rootMargin, visibleCount]);

  return {
    visibleItems,
    visibleCount,
    totalCount,
    hasMore,
    remaining,
    loadMore,
    sentinelRef,
  };
}
