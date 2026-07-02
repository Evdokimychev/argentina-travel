"use client";

import SiteRouteError from "@/components/site/SiteRouteError";

export default function ExcursionDetailError({
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
      title="Не удалось загрузить экскурсию"
      description="Возможно, данные партнёра временно недоступны. Попробуйте обновить страницу."
      homeHref="/excursions"
      homeLabel="Каталог экскурсий"
      secondaryHref="/tours"
      secondaryLabel="Каталог туров"
    />
  );
}
