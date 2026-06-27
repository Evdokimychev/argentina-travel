"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import { scrollToSiteAnchor } from "@/lib/scroll-anchor";

type ReviewPromptBannerProps = {
  tourSlug: string;
  isPartnerTour?: boolean;
};

function ReviewPromptBannerInner({ tourSlug, isPartnerTour }: ReviewPromptBannerProps) {
  const searchParams = useSearchParams();
  const wantsReview = searchParams.get("review") === "1";
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!wantsReview) return;
    scrollToSiteAnchor("leave-review");
  }, [wantsReview]);

  if (isPartnerTour || dismissed) return null;

  return (
    <div className={cn(siteContainerClass, "pt-4")}>
      <div className="flex flex-col gap-3 rounded-2xl border border-sky/20 bg-sky/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="font-medium text-charcoal">
            {wantsReview ? "Поделитесь впечатлениями о поездке" : "Были на этом туре?"}
          </p>
          <p className="mt-1 text-sm text-slate">
            {wantsReview
              ? "Заполните форму ниже — отзыв появится на странице после модерации."
              : "После завершённой поездки можно оставить отзыв — он появится на странице после модерации."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {!wantsReview ? (
            <Link
              href={`/tours/${tourSlug}?review=1#leave-review`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Оставить отзыв
            </Link>
          ) : (
            <Link href="/profile/reviews" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
              Мои отзывы
            </Link>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate hover:bg-gray-50"
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
