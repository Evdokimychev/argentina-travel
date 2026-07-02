"use client";

import SiteRouteError from "@/components/site/SiteRouteError";

export default function DestinationsRouteError({
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
      title="Не удалось загрузить раздел"
      description="Обзор регионов временно недоступен. Попробуйте обновить страницу."
      homeHref="/"
      homeLabel="На главную"
      secondaryHref="/places"
      secondaryLabel="Справочник мест"
    />
  );
}
