"use client";

import SiteRouteError from "@/components/site/SiteRouteError";

export default function BookingRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-var(--site-header-full-height,72px))] bg-pampas">
      <SiteRouteError
        error={error}
        reset={reset}
        title="Не удалось загрузить страницу бронирования"
        description="Попробуйте обновить страницу. Если ошибка повторится, найдите заявку по email или выберите тур в каталоге."
        homeHref="/booking/find"
        homeLabel="Найти заявку"
        secondaryHref="/tours"
        secondaryLabel="Каталог туров"
      />
    </div>
  );
}
