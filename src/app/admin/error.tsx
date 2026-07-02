"use client";

import SiteRouteError from "@/components/site/SiteRouteError";

export default function AdminRouteError({
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
      title="Ошибка в панели администратора"
      description="Не удалось загрузить раздел. Попробуйте обновить страницу или вернитесь к сводке."
      homeHref="/admin"
      homeLabel="Сводка"
      secondaryHref="/"
      secondaryLabel="На сайт"
      variant="panel"
      className="m-6"
    />
  );
}
