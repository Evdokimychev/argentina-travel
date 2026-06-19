"use client";

import { useEffect } from "react";
import Link from "next/link";
import { siteContainerClass } from "@/lib/site-container";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ExcursionDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Excursion detail render failed:", error);
  }, [error]);

  return (
    <div
      className={`${siteContainerClass} flex min-h-[50vh] flex-col items-center justify-center py-16 text-center`}
    >
      <h1 className="font-heading text-2xl font-bold text-charcoal">
        Не удалось загрузить экскурсию
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate">
        Возможно, данные партнёра временно недоступны. Попробуйте обновить страницу.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Попробовать снова</Button>
        <Link href="/excursions" className={buttonVariants({ variant: "ghost" })}>
          Каталог экскурсий
        </Link>
      </div>
    </div>
  );
}
