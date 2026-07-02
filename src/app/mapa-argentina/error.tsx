"use client";

import SiteRouteError from "@/components/site/SiteRouteError";

export default function MapaArgentinaRouteError({
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
      title="Не удалось загрузить карту"
      description="Данные карты временно недоступны. Попробуйте обновить страницу или вернитесь позже."
      homeHref="/"
      homeLabel="На главную"
      secondaryHref="/destinations"
      secondaryLabel="Регионы и места"
    />
  );
}
