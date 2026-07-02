"use client";

import SiteRouteError from "@/components/site/SiteRouteError";

export default function ExcursionsCatalogRouteError({
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
      title="Не удалось загрузить каталог экскурсий"
      description="Список экскурсий временно недоступен. Попробуйте обновить страницу."
      homeHref="/"
      homeLabel="На главную"
      secondaryHref="/tours"
      secondaryLabel="Каталог туров"
    />
  );
}
