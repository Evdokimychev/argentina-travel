"use client";

import SiteRouteError from "@/components/site/SiteRouteError";

/**
 * Segment-level error boundary for a tour page. The partner (Tripster) detail
 * enrichment depends on a live external API, so a transient upstream failure
 * shouldn't take down the whole route with an unhandled exception — show a
 * recoverable state with a retry instead.
 */
export default function TourDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SiteRouteError
      error={error}
      reset={reset}
      title="Не удалось загрузить путешествие"
      description="Возможно, данные партнёра или каталога временно недоступны. Обычно помогает обновление страницы."
      homeHref="/tours"
      homeLabel="Каталог туров"
      secondaryHref="/excursions"
      secondaryLabel="Экскурсии"
    />
  );
}
