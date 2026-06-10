"use client";

import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";

interface TourPreviewBannerProps {
  title: string;
  editHref: string;
  isPublished: boolean;
}

export default function TourPreviewBanner({
  title,
  editHref,
  isPublished,
}: TourPreviewBannerProps) {
  return (
    <div className="border-b border-amber-200/80 bg-amber-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm ring-1 ring-amber-200/80">
            <Eye className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-charcoal">Предпросмотр тура</p>
            <p className="mt-0.5 truncate text-sm text-slate">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate">
              {isPublished
                ? "Так страница выглядит для туристов. Бронирование в предпросмотре отключено."
                : "Тур ещё не опубликован — туристы эту страницу не увидят. Бронирование недоступно."}
            </p>
          </div>
        </div>

        <Link
          href={editHref}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-amber-100/60"
        >
          <ArrowLeft className="h-4 w-4" />
          Вернуться к редактированию
        </Link>
      </div>
    </div>
  );
}
