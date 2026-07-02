"use client";

import { useEffect } from "react";
import Link from "next/link";
import { captureException } from "@/lib/monitoring/sentry";
import { useRouteErrorRetry } from "@/hooks/useRouteErrorRetry";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleRetry = useRouteErrorRetry(reset);

  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4 text-center">
        <h1 className="font-heading text-2xl font-bold text-charcoal">Что-то пошло не так</h1>
        <p className="mt-2 max-w-md text-sm text-slate">
          Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернитесь на главную.
        </p>
        <ul className="mx-auto mt-4 max-w-md list-disc space-y-1 pl-5 text-left text-sm text-slate">
          <li>Обновите страницу</li>
          <li>Проверьте интернет-соединение</li>
          <li>Если ошибка повторяется — напишите нам через форму контактов</li>
        </ul>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-full bg-charcoal px-5 py-2.5 text-sm font-medium text-white hover:bg-charcoal/90"
          >
            Повторить
          </button>
          <Link
            href="/"
            className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-charcoal hover:border-sky hover:text-sky"
          >
            На главную
          </Link>
          <Link
            href="/contacts"
            className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-charcoal hover:border-sky hover:text-sky"
          >
            Контакты
          </Link>
        </div>
      </body>
    </html>
  );
}
