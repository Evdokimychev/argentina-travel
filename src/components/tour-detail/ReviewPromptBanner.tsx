"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import { scrollToSiteAnchor } from "@/lib/scroll-anchor";
import { useAuth } from "@/context/AuthContext";
import { getUserBookings } from "@/lib/bookings-store";
import { getUserReviews } from "@/lib/reviews-store";
import { resolveReviewEligibility } from "@/lib/review-eligibility";

type ReviewPromptBannerProps = {
  tourSlug: string;
  isPartnerTour?: boolean;
};

function ReviewPromptBannerInner({ tourSlug, isPartnerTour }: ReviewPromptBannerProps) {
  const searchParams = useSearchParams();
  const wantsReview = searchParams.get("review") === "1";
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [eligibleForReview, setEligibleForReview] = useState(false);

  useEffect(() => {
    if (!wantsReview || !user || isPartnerTour) {
      setEligibleForReview(false);
      return;
    }
    const eligibility = resolveReviewEligibility({
      tourSlug,
      bookings: getUserBookings(user.id),
      reviews: getUserReviews(user.id),
    });
    setEligibleForReview(eligibility.eligible);
  }, [isPartnerTour, tourSlug, user, wantsReview]);

  useEffect(() => {
    if (!eligibleForReview) return;
    scrollToSiteAnchor("leave-review");
  }, [eligibleForReview]);

  if (!eligibleForReview || dismissed) return null;

  return (
    <div className={cn(siteContainerClass, "pt-4")}>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-sky/20 bg-sky/5 px-4 py-3 sm:px-5">
        <div>
          <p className="text-sm font-medium text-charcoal sm:text-base">
            Поделитесь впечатлениями о поездке
          </p>
          <p className="mt-1 hidden text-sm text-slate sm:block">
            Форма отзыва открыта ниже; публикация появится после модерации.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/profile/reviews"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "hidden sm:inline-flex")}
          >
            Мои отзывы
          </Link>
          <button
            type="button"
            aria-label="Закрыть приглашение оставить отзыв"
            onClick={() => setDismissed(true)}
            className="min-h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-slate hover:bg-gray-50"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPromptBanner(props: ReviewPromptBannerProps) {
  if (props.isPartnerTour) return null;

  return (
    <Suspense fallback={null}>
      <ReviewPromptBannerInner {...props} />
    </Suspense>
  );
}
