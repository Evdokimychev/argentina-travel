"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { MessageSquare } from "lucide-react";
import { TourReview } from "@/types";
import { formatDate } from "@/lib/utils";
import { formatReviews } from "@/lib/pluralize";
import { EmptyState } from "@/components/ui/empty-state";
import { StarRating } from "@/components/ui/star-rating";
import { SectionHeading } from "./InfoModal";

const PER_PAGE = 3;

export default function ReviewsSection({
  reviews,
  rating,
  reviewCount,
}: {
  reviews: TourReview[];
  rating: number;
  reviewCount: number;
}) {
  const [filter, setFilter] = useState<number | "all">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (filter === "all") return reviews;
    return reviews.filter((r) => r.rating === filter);
  }, [reviews, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (reviews.length === 0) {
    return (
      <section id="reviews" className="tour-section-target">
        <SectionHeading title="Отзывы" />
        <EmptyState
          icon={MessageSquare}
          title="Отзывов пока нет"
          description="Будьте первым — оставьте отзыв после поездки."
          bordered={false}
          className="px-0"
        />
      </section>
    );
  }

  return (
    <section id="reviews" className="tour-section-target">
      <SectionHeading
        title="Отзывы"
        subtitle={`${rating} · ${formatReviews(reviewCount)}`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", 5, 4, 3] as const).map((f) => (
          <button
            key={String(f)}
            type="button"
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-sky text-white"
                : "border border-gray-200 bg-white text-slate hover:border-gray-300"
            }`}
          >
            {f === "all" ? "Все" : `${f} ★`}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {paginated.map((review) => (
          <article
            key={review.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                <Image src={review.avatar} alt={review.author} fill className="object-cover" sizes="40px" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-charcoal">{review.author}</p>
                    {review.verifiedTrip ? (
                      <span className="rounded-full bg-sky/10 px-2 py-0.5 text-[11px] font-medium text-sky">
                        Проверенная поездка
                      </span>
                    ) : null}
                  </div>
                  <StarRating stars={review.rating} size="md" />
                </div>
                <p className="mt-1 text-xs text-slate">
                  Поездка: {formatDate(review.tripDate)} · {formatDate(review.date)}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate">{review.text}</p>
                {review.photos.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {review.photos.map((photo) => (
                      <div key={photo} className="relative h-20 w-28 overflow-hidden rounded-lg">
                        <Image src={photo} alt="" fill className="object-cover" sizes="112px" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-40"
          >
            Назад
          </button>
          <span className="text-sm text-slate">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-40"
          >
            Далее
          </button>
        </div>
      )}
    </section>
  );
}
