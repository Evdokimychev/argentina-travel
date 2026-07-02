"use client";

import SiteRouteError from "@/components/site/SiteRouteError";

export default function ToursCatalogRouteError({
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
      title="Не удалось загрузить каталог туров"
      description="Список туров временно недоступен. Обычно помогает обновление страницы."
      homeHref="/"
      homeLabel="На главную"
      secondaryHref="/excursions"
      secondaryLabel="Экскурсии"
    />
  );
}
