"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { useRouteErrorRetry } from "@/hooks/useRouteErrorRetry";
import { siteContainerClass } from "@/lib/site-container";

export default function BookingRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleRetry = useRouteErrorRetry(reset);

  useEffect(() => {
    console.error("Booking route error:", error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-var(--site-header-full-height,72px))] bg-pampas">
      <div
        className={`${siteContainerClass} flex min-h-[50vh] flex-col items-center justify-center py-16 text-center`}
      >
        <h1 className="font-heading text-2xl font-bold text-charcoal">
          Не удалось загрузить страницу бронирования
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate">
          Попробуйте обновить страницу. Если ошибка повторится, найдите заявку по email или
          выберите тур в каталоге.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={handleRetry}>
            Попробовать снова
          </Button>
          <Link href="/booking/find" className={buttonVariants({ variant: "outline" })}>
            Найти заявку
          </Link>
          <Link href="/tours" className={buttonVariants({ variant: "ghost" })}>
            Каталог туров
          </Link>
        </div>
      </div>
    </div>
  );
}
