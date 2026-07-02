"use client";

import SiteRouteError from "@/components/site/SiteRouteError";
import { cabinetPanelClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";

type CabinetRouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
};

export default function CabinetRouteError({
  error,
  reset,
  title = "Не удалось загрузить раздел",
  description = "Произошла ошибка при отображении страницы. Попробуйте обновить или вернитесь позже.",
  homeHref = "/profile",
  homeLabel = "На главную кабинета",
}: CabinetRouteErrorProps) {
  return (
    <SiteRouteError
      error={error}
      reset={reset}
      title={title}
      description={description}
      homeHref={homeHref}
      homeLabel={homeLabel}
      variant="panel"
      className={cn(cabinetPanelClass, "border-dashed")}
    />
  );
}
