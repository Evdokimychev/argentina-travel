"use client";

import { StarRating } from "@/components/ui/star-rating";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import type { ExcursionReview } from "@/types/excursion";

export default function ExcursionReviewsSection({ reviews }: { reviews: ExcursionReview[] }) {
  const { t } = useLocaleCurrency();

  if (!reviews.length) return null;

  return (
    <section id="reviews" className="mt-10">
      <h2 className="font-heading text-xl font-bold text-charcoal">
        {t("excursions.section.reviews")}
      </h2>
      <ul className="mt-4 space-y-4">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-charcoal">
                {review.authorName ?? t("excursions.reviewGuest")}
              </p>
              {review.rating != null ? (
                <StarRating layout="inline" score={review.rating.toFixed(1)} />
              ) : null}
            </div>
            {review.text ? (
              <p className="mt-2 text-sm leading-relaxed text-charcoal/90">{review.text}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
