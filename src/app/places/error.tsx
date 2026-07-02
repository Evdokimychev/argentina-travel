"use client";

import SiteRouteError from "@/components/site/SiteRouteError";

export default function PlacesRouteError({
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
      title="Не удалось загрузить справочник мест"
      description="Данные о местах временно недоступны. Попробуйте обновить страницу."
      homeHref="/destinations"
      homeLabel="Регионы и места"
      secondaryHref="/"
      secondaryLabel="На главную"
    />
  );
}
