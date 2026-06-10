"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useSearchParams } from "next/navigation";

export default function ReviewPromptBanner() {
  const searchParams = useSearchParams();
  const wantsReview = searchParams.get("review") === "1";
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!wantsReview) return;
    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [wantsReview]);

  if (!wantsReview || dismissed) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-sky/20 bg-sky/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="font-medium text-charcoal">Поделитесь впечатлениями о поездке</p>
          <p className="mt-1 text-sm text-slate">
            Полная форма отзыва появится после интеграции с личным кабинетом. Пока можно
            просмотреть отзывы других путешественников ниже.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/profile/reviews" className={cn(buttonVariants({ size: "sm" }))}>
            Мои отзывы
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-slate hover:bg-white"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
