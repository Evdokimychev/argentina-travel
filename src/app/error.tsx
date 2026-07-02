"use client";

import SiteRouteError from "@/components/site/SiteRouteError";

export default function RootRouteError({
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
      title="Не удалось загрузить страницу"
      description="Произошла ошибка при отображении. Попробуйте обновить или вернитесь на главную."
      homeHref="/"
      homeLabel="На главную"
      secondaryHref="/contacts"
      secondaryLabel="Контакты"
    />
  );
}
