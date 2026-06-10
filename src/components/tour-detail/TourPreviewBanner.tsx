"use client";

import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";

interface TourPreviewBannerProps {
  title: string;
  editHref: string;
  isPublished: boolean;
  publishBlockingCount?: number;
}

export default function TourPreviewBanner({
  title,
  editHref,
  isPublished,
  publishBlockingCount = 0,
}: TourPreviewBannerProps) {
  return (
    <div className="border-b border-warning/20 bg-warning-muted">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-warning shadow-sm ring-1 ring-warning/20">
            <Eye className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-charcoal">Предпросмотр тура</p>
            <p className="mt-0.5 truncate text-sm text-slate">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate">
              {isPublished
                ? "Так страница выглядит для туристов. Бронирование в предпросмотре отключено."
                : "Тур ещё не опубликован — туристы эту страницу не увидят. Бронирование недоступно."}
              {publishBlockingCount > 0 ? (
                <>
                  {" "}
                  Для публикации осталось исправить {publishBlockingCount}{" "}
                  {publishBlockingCount === 1 ? "пункт" : "пункта"} в чеклисте.
                </>
              ) : null}
            </p>
          </div>
        </div>

        <Link
          href={editHref}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-warning/20 bg-white px-4 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-warning-muted/60"
        >
          <ArrowLeft className="h-4 w-4" />
          Вернуться к редактированию
        </Link>
      </div>
    </div>
  );
}
