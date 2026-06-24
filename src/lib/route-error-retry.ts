import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/** Сброс error boundary и повторная загрузка данных маршрута с сервера. */
export function retryRoutePage(
  reset: () => void,
  router: Pick<AppRouterInstance, "refresh">,
): void {
  reset();
  router.refresh();
}

/** Полное обновление страницы — надёжный fallback, если soft-retry не помог. */
export function reloadRoutePage(): void {
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

/**
 * Сброс границы ошибки и полная перезагрузка страницы.
 * Используется на global-error и сегментных error.tsx — соответствует тексту «обновить страницу».
 */
export function retryRouteErrorHard(reset: () => void): void {
  try {
    reset();
  } catch {
    /* boundary may be in broken state — reload anyway */
  }
  reloadRoutePage();
}
