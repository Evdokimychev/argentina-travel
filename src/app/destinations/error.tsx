"use client";

import { useEffect } from "react";
import Link from "next/link";
import { siteContainerClass } from "@/lib/site-container";
import { Button, buttonVariants } from "@/components/ui/button";

export default function DestinationsRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Destinations route error:", error);
  }, [error]);

  return (
    <div className={`${siteContainerClass} flex min-h-[50vh] flex-col items-center justify-center py-16 text-center`}>
      <h1 className="font-heading text-2xl font-bold text-charcoal">
        Не удалось загрузить раздел
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate">
        Попробуйте обновить страницу или вернитесь к обзору регионов.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={reset}>
          Попробовать снова
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          На главную
        </Link>
      </div>
    </div>
  );
}
