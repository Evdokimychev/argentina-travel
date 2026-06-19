"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  getOrganizerReviewsForCabinet,
  getOrganizerReviewsSummary,
} from "@/lib/organizer-reviews";
import { isSupabaseReviewsEnabled } from "@/lib/auth-mode";
import { REVIEWS_UPDATED_EVENT, type TouristReview } from "@/types/tourist";
import { cabinetCardClass, cabinetHeroClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Оценка ${rating} из 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            "h-4 w-4",
            index < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
          )}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export default function OrganizerReviewsView() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ count: 0, averageRating: null as number | null });
  const [reviews, setReviews] = useState<TouristReview[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);
  const [savedReplyId, setSavedReplyId] = useState<string | null>(null);
  const reviewsApiEnabled = isSupabaseReviewsEnabled();

  useEffect(() => {
    if (!user) return;

    function mapReplyDrafts(nextReviews: TouristReview[]) {
      return Object.fromEntries(nextReviews.map((review) => [review.id, review.organizerReply ?? ""]));
    }

    async function refresh() {
      if (reviewsApiEnabled) {
        try {
          const res = await fetch("/api/organizer/reviews");
          if (res.ok) {
            const json = (await res.json()) as {
              reviews?: TouristReview[];
              summary?: { count: number; averageRating: number | null };
            };
            const nextReviews = json.reviews ?? [];
            setReviews(nextReviews);
            setSummary(json.summary ?? { count: 0, averageRating: null });
            setReplyDrafts(mapReplyDrafts(nextReviews));
            return;
          }
        } catch {
          // fallback
        }
      }

      const nextReviews = getOrganizerReviewsForCabinet(user!.id);
      setReviews(nextReviews);
      setSummary(getOrganizerReviewsSummary(user!.id));
      setReplyDrafts(mapReplyDrafts(nextReviews));
    }

    void refresh();
    function onUpdated() {
      void refresh();
    }
    window.addEventListener(REVIEWS_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(REVIEWS_UPDATED_EVENT, onUpdated);
  }, [user, reviewsApiEnabled]);

  const hasReviews = reviews.length > 0;

  const heroText = useMemo(() => {
    if (!hasReviews) return "Пока нет опубликованных отзывов по вашим турам.";
    if (summary.averageRating != null) {
      return `${summary.count} отзыв${summary.count === 1 ? "" : summary.count < 5 ? "а" : "ов"} · средняя оценка ${summary.averageRating}`;
    }
    return `${summary.count} отзывов`;
  }, [hasReviews, summary]);

  function updateReplyDraft(reviewId: string, value: string) {
    setReplyDrafts((current) => ({ ...current, [reviewId]: value }));
    setReplyErrors((current) => {
      const next = { ...current };
      delete next[reviewId];
      return next;
    });
    if (savedReplyId === reviewId) {
      setSavedReplyId(null);
    }
  }

  async function saveOrganizerReply(reviewId: string) {
    if (!reviewsApiEnabled) return;
    const draft = (replyDrafts[reviewId] ?? "").trim();
    if (!draft) {
      setReplyErrors((current) => ({ ...current, [reviewId]: "Введите текст ответа" }));
      return;
    }

    setSavingReplyId(reviewId);
    setSavedReplyId(null);
    setReplyErrors((current) => {
      const next = { ...current };
      delete next[reviewId];
      return next;
    });

    try {
      const response = await fetch(`/api/organizer/reviews/${encodeURIComponent(reviewId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: draft }),
      });
      const payload = (await response.json()) as { review?: TouristReview; error?: string };
      if (!response.ok || !payload.review) {
        throw new Error(payload.error ?? "Не удалось сохранить ответ");
      }

      const updatedReview = payload.review;
      setReviews((current) =>
        current.map((review) => (review.id === reviewId ? updatedReview : review))
      );
      setReplyDrafts((current) => ({
        ...current,
        [reviewId]: updatedReview.organizerReply ?? "",
      }));
      setSavedReplyId(reviewId);
    } catch (error) {
      setReplyErrors((current) => ({
        ...current,
        [reviewId]: error instanceof Error ? error.message : "Не удалось сохранить ответ",
      }));
    } finally {
      setSavingReplyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className={cabinetHeroClass}>
        <h1 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">Отзывы</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate">{heroText}</p>
        <p className="mt-3 text-xs text-slate">
          Показаны только опубликованные отзывы после модерации платформы.
        </p>
      </header>

      {!hasReviews ? (
        <EmptyState
          icon={Star}
          title="Отзывов пока нет"
          description="Когда туристы оставят отзывы на ваши туры, они появятся здесь после проверки."
        />
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => {
            const currentReply = review.organizerReply?.trim() ?? "";
            const draftReply = replyDrafts[review.id] ?? currentReply;
            const canSaveReply = draftReply.trim().length > 0 && draftReply.trim() !== currentReply;

            return (
              <li key={review.id} className={cn(cabinetCardClass, "p-5")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <Link
                      href={`/tours/${review.tourSlug}`}
                      className="font-medium text-charcoal hover:text-sky"
                    >
                      {review.tourTitle}
                    </Link>
                    <p className="text-xs text-slate">{formatWhen(review.updatedAt)}</p>
                  </div>
                  <RatingStars rating={review.rating} />
                </div>
                {review.text ? (
                  <p className="mt-3 text-sm leading-relaxed text-charcoal">{review.text}</p>
                ) : null}
                {review.tripDate ? (
                  <p className="mt-2 text-xs text-slate">Поездка: {formatWhen(review.tripDate)}</p>
                ) : null}
                <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <label
                    htmlFor={`organizer-review-reply-${review.id}`}
                    className="text-xs font-semibold uppercase tracking-wide text-slate"
                  >
                    Ответ туристу
                  </label>
                  <Textarea
                    id={`organizer-review-reply-${review.id}`}
                    className="mt-2 min-h-[110px] bg-white"
                    placeholder="Поблагодарите туриста за отзыв и дайте краткий комментарий."
                    maxLength={3000}
                    value={draftReply}
                    onChange={(event) => updateReplyDraft(review.id, event.target.value)}
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate">
                      {!reviewsApiEnabled
                        ? "Ответы организатора доступны при включённой серверной базе."
                        : review.organizerRepliedAt
                          ? `Последний ответ: ${formatWhen(review.organizerRepliedAt)}`
                          : "Ответ появится на сайте после отдельной публикации блока отзывов."}
                    </p>
                    <Button
                      size="sm"
                      loading={savingReplyId === review.id}
                      disabled={!reviewsApiEnabled || !canSaveReply}
                      onClick={() => void saveOrganizerReply(review.id)}
                    >
                      Сохранить ответ
                    </Button>
                  </div>
                  {replyErrors[review.id] ? (
                    <p className="mt-2 text-xs text-error">{replyErrors[review.id]}</p>
                  ) : null}
                  {savedReplyId === review.id ? (
                    <p className="mt-2 text-xs text-emerald-700">Ответ сохранён</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
