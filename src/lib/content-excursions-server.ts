import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { fetchExcursionsServer } from "@/lib/excursion-server";
import type { ExcursionListing } from "@/types/excursion";

const CONTENT_EXCURSION_DEADLINE_MS = 1_200;

function withDeadline<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(fallback), CONTENT_EXCURSION_DEADLINE_MS);
    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      () => {
        clearTimeout(timeout);
        resolve(fallback);
      },
    );
  });
}

async function loadContentExcursions(): Promise<ExcursionListing[]> {
  const result = await withDeadline(
    fetchExcursionsServer({ page: 1, pageSize: 500, sort: "popular" }),
    null,
  );
  if (!result) return [];
  return result.items.filter(
    (item) => item.partner === "tripster" || item.partner === "sputnik8",
  );
}

const getCachedContentExcursions = unstable_cache(
  loadContentExcursions,
  ["content-excursions-v1"],
  { revalidate: 120, tags: ["excursions"] },
);

/** Синхронизированный партнёрский каталог для серверных контентных рекомендаций. */
export const fetchContentExcursionsServer = cache(getCachedContentExcursions);
