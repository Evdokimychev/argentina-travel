"use client";

import { useEffect } from "react";
import Link from "next/link";
import { siteContainerClass } from "@/lib/site-container";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * Segment-level error boundary for a tour page. The partner (Tripster) detail
 * enrichment depends on a live external API, so a transient upstream failure
 * shouldn't take down the whole route with an unhandled exception — show a
 * recoverable state with a retry instead.
 */
export default function TourDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Tour detail render failed:", error);
  }, [error]);

  return (
    <div className={`${siteContainerClass} flex min-h-[50vh] flex-col items-center justify-center py-16 text-center`}>
      <h1 className="font-heading text-2xl font-bold text-charcoal">
        Не удалось загрузить путешествие
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate">
        Возможно, данные временно недоступны. Попробуйте обновить страницу — обычно
        это решает проблему.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Попробовать снова</Button>
        <Link href="/tours" className={buttonVariants({ variant: "ghost" })}>
          Вернуться в каталог
        </Link>
      </div>
    </div>
  );
}
