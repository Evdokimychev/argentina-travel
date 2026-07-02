"use client";

import SiteRouteError from "@/components/site/SiteRouteError";

export default function BlogRouteError({
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
      title="Не удалось загрузить блог"
      description="Статьи временно недоступны. Попробуйте обновить страницу."
      homeHref="/blog"
      homeLabel="Все статьи"
      secondaryHref="/"
      secondaryLabel="На главную"
    />
  );
}
