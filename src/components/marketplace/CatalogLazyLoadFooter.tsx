"use client";

import type { RefObject } from "react";
import { Button } from "@/components/ui/button";

type CatalogLazyLoadFooterProps = {
  hasMore: boolean;
  pageSize: number;
  remaining: number;
  visibleCount: number;
  totalCount: number;
  onLoadMore: () => void;
  sentinelRef: RefObject<HTMLDivElement | null>;
};

export default function CatalogLazyLoadFooter({
  hasMore,
  pageSize,
  remaining,
  visibleCount,
  totalCount,
  onLoadMore,
  sentinelRef,
}: CatalogLazyLoadFooterProps) {
  if (!hasMore) return null;

  const nextBatch = Math.min(pageSize, remaining);

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <div ref={sentinelRef} className="h-px w-full shrink-0" aria-hidden />
      <Button
        type="button"
        variant="outline"
        className="rounded-full px-8"
        onClick={onLoadMore}
      >
        Показать ещё {nextBatch}
      </Button>
      <p className="text-xs text-slate">
        Показано {visibleCount} из {totalCount}
      </p>
    </div>
  );
}
