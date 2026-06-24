"use client";

import { useCallback } from "react";
import { retryRouteErrorHard } from "@/lib/route-error-retry";

/** Обработчик «Повторить» / «Попробовать снова» для Next.js error boundaries. */
export function useRouteErrorRetry(reset: () => void) {
  return useCallback(() => retryRouteErrorHard(reset), [reset]);
}
