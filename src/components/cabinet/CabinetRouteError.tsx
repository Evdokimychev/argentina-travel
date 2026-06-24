"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useRouteErrorRetry } from "@/hooks/useRouteErrorRetry";
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
  const handleRetry = useRouteErrorRetry(reset);

  useEffect(() => {
    console.error("Cabinet route error:", error);
  }, [error]);

  return (
    <div className={cn(cabinetPanelClass, "text-center")}>
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertCircle className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-4 font-heading text-xl font-bold text-charcoal">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={handleRetry}>
          Попробовать снова
        </Button>
        <Link href={homeHref} className={buttonVariants({ variant: "outline" })}>
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
