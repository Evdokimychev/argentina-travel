"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { isSupabaseReviewsEnabled } from "@/lib/auth-mode";
import { createReview, submitReviewForModeration } from "@/lib/reviews-store";
import type { ReviewEligibilityResult } from "@/lib/review-eligibility";
import { resolveReviewEligibility } from "@/lib/review-eligibility";
import { getUserBookings } from "@/lib/bookings-store";
import { getUserReviews } from "@/lib/reviews-store";
import type { TouristReview } from "@/types/tourist";
import { StarRatingInput } from "@/components/ui/star-rating-input";

type TourReviewFormProps = {
  tourId: string;
  tourSlug: string;
  tourTitle: string;
  organizerTourId?: string;
  eligibility?: ReviewEligibilityResult;
  onSubmitted?: () => void;
  className?: string;
};

export default function TourReviewForm({
  tourId,
  tourSlug,
  tourTitle,
  organizerTourId,
  eligibility: initialEligibility,
  onSubmitted,
  className,
}: TourReviewFormProps) {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<ReviewEligibilityResult | null>(
    initialEligibility ?? null
  );
  const [loadingEligibility, setLoadingEligibility] = useState(!initialEligibility);
  const [rating, setRating] = useState(initialEligibility?.existingReview?.rating ?? 5);
  const [text, setText] = useState(initialEligibility?.existingReview?.text ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshEligibility = useCallback(async () => {
    if (!user) {
      setEligibility(null);
      setLoadingEligibility(false);
      return;
    }

    if (isSupabaseReviewsEnabled()) {
      setLoadingEligibility(true);
      try {
        const res = await fetch(
          `/api/reviews/eligibility?tourSlug=${encodeURIComponent(tourSlug)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const json = (await res.json()) as { eligibility?: ReviewEligibilityResult };
          if (json.eligibility) {
            setEligibility(json.eligibility);
            if (json.eligibility.existingReview) {
              setRating(json.eligibility.existingReview.rating);
              setText(json.eligibility.existingReview.text);
            }
            return;
          }
        }
      } catch {
        // fallback below
      } finally {
        setLoadingEligibility(false);
      }
    }

    const localEligibility = resolveReviewEligibility({
      tourSlug,
      bookings: getUserBookings(user.id),
      reviews: getUserReviews(user.id),
    });
    setEligibility(localEligibility);
    if (localEligibility.existingReview) {
      setRating(localEligibility.existingReview.rating);
      setText(localEligibility.existingReview.text);
    }
    setLoadingEligibility(false);
  }, [tourSlug, user]);

  useEffect(() => {
    if (initialEligibility) return;
    void refreshEligibility();
  }, [initialEligibility, refreshEligibility]);

  useEffect(() => {
    if (initialEligibility) {
      setEligibility(initialEligibility);
      if (initialEligibility.existingReview) {
        setRating(initialEligibility.existingReview.rating);
        setText(initialEligibility.existingReview.text);
      }
    }
  }, [initialEligibility]);

  async function persistReview(status: "draft" | "pending"): Promise<TouristReview | { error: string }> {
    if (!user || !eligibility?.eligible) {
      return { error: "Нет доступа" };
    }

    const trimmed = text.trim();
    if (!trimmed) return { error: "Напишите текст отзыва" };

    const payload: TouristReview = {
      id: eligibility.existingReview?.id ?? `review-${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      tourId,
      tourSlug,
      tourTitle,
      bookingId: eligibility.bookingId ?? eligibility.existingReview?.bookingId,
      rating,
      text: trimmed,
      photos: eligibility.existingReview?.photos ?? [],
      tripDate: eligibility.tripDate ?? eligibility.existingReview?.tripDate,
      status: "draft",
      createdAt: eligibility.existingReview?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseReviewsEnabled()) {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review: payload, organizerTourId }),
      });
      const json = (await res.json()) as { review?: TouristReview; error?: string };
      if (!res.ok) return { error: json.error ?? "Не удалось сохранить отзыв" };
      if (!json.review) return { error: "Не удалось сохранить отзыв" };

      if (status === "pending") {
        const submitRes = await fetch(`/api/reviews/${encodeURIComponent(json.review.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "submit", rating, text: trimmed, tripDate: payload.tripDate }),
        });
        const submitJson = (await submitRes.json()) as { review?: TouristReview; error?: string };
        if (!submitRes.ok) return { error: submitJson.error ?? "Не удалось отправить на модерацию" };
        return submitJson.review ?? json.review;
      }

      return json.review;
    }

    const local =
      eligibility.existingReview ??
      createReview({
        actor: user,
        userId: user.id,
        tourId,
        tourSlug,
        tourTitle,
        bookingId: payload.bookingId,
        rating,
        text: trimmed,
        tripDate: payload.tripDate,
        status: "draft",
      });

    if ("error" in local) return local;

    if (status === "pending") {
      const submitted = await submitReviewForModeration(local.id, user);
      if ("error" in submitted) return submitted;
      return submitted.review;
    }

    return local;
  }

  async function handleSubmit(action: "draft" | "pending") {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const result = await persistReview(action);
      if ("error" in result) {
        setError(result.error);
        return;
      }

      if (action === "pending") {
        setSuccess("Отзыв отправлен на модерацию. Мы сообщим, когда он появится на сайте.");
        setEligibility({
          eligible: false,
          reason: "pending_review",
          message: "Отзыв на модерации — мы сообщим, когда он появится на сайте.",
          existingReview: result,
        });
      } else {
        setSuccess("Черновик сохранён — можно вернуться и отправить позже.");
        setEligibility((current) =>
          current
            ? { ...current, existingReview: result }
            : {
                eligible: true,
                message: "Черновик сохранён.",
                existingReview: result,
              }
        );
      }

      onSubmitted?.();
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className={cn("rounded-2xl border border-gray-200 bg-white p-5 shadow-sm", className)}>
        <p className="font-medium text-charcoal">Оставить отзыв о поездке</p>
        <p className="mt-1 text-sm text-slate">
          Войдите в аккаунт, чтобы поделиться впечатлениями после завершённого тура.
        </p>
        <Link href="/login" className={cn(buttonVariants({ size: "sm" }), "mt-4 inline-flex")}>
          Войти
        </Link>
      </div>
    );
  }

  if (loadingEligibility) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-slate shadow-sm",
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Проверяем возможность оставить отзыв…
      </div>
    );
  }

  if (!eligibility?.eligible) {
    return (
      <div className={cn("rounded-2xl border border-gray-200 bg-white p-5 shadow-sm", className)}>
        <p className="font-medium text-charcoal">Отзыв о поездке</p>
        <p className="mt-1 text-sm text-slate">{eligibility?.message ?? "Отзыв недоступен."}</p>
        {eligibility?.existingReview?.status === "rejected" && eligibility.existingReview.moderationNotes ? (
          <p className="mt-2 text-xs text-red-600">
            Комментарий модератора: {eligibility.existingReview.moderationNotes}
          </p>
        ) : null}
        <Link href="/profile/reviews" className={cn(cabinetLinkInline(), "mt-3 inline-flex text-sm")}>
          Мои отзывы
        </Link>
      </div>
    );
  }

  return (
    <form
      className={cn("rounded-2xl border border-sky/20 bg-sky/5 p-5 shadow-sm", className)}
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit("pending");
      }}
    >
      <p className="font-medium text-charcoal">Оставить отзыв</p>
      <p className="mt-1 text-sm text-slate">{eligibility.message}</p>

      <div className="mt-4">
        <p className="text-sm font-medium text-charcoal">Оценка</p>
        <StarRatingInput value={rating} onChange={setRating} className="mt-2" />
      </div>

      <div className="mt-4">
        <label htmlFor="tour-review-text" className="text-sm font-medium text-charcoal">
          Ваши впечатления
        </label>
        <textarea
          id="tour-review-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={5}
          maxLength={4000}
          required
          placeholder="Расскажите, что понравилось, что стоит учесть будущим путешественникам…"
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-charcoal outline-none ring-sky/30 focus:ring-2"
        />
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-700">{success}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className={cn(buttonVariants({ size: "sm" }), "disabled:opacity-60")}
        >
          {submitting ? "Отправка…" : "Отправить на модерацию"}
        </button>
        <button
          type="button"
          disabled={submitting || !text.trim()}
          onClick={() => void handleSubmit("draft")}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate hover:bg-gray-50 disabled:opacity-60"
        >
          Сохранить черновик
        </button>
      </div>
    </form>
  );
}

function cabinetLinkInline(): string {
  return "font-medium text-sky transition-colors hover:text-sky/80";
}
