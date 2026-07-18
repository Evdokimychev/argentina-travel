"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const ReviewPromptBanner = dynamic(() => import("./ReviewPromptBanner"), {
  ssr: false,
});

type OnDemandReviewPromptBannerProps = {
  tourSlug: string;
};

/** The eligibility stores are only needed for an explicit post-trip review link. */
export default function OnDemandReviewPromptBanner({
  tourSlug,
}: OnDemandReviewPromptBannerProps) {
  const searchParams = useSearchParams();
  if (searchParams.get("review") !== "1") return null;
  return <ReviewPromptBanner tourSlug={tourSlug} />;
}
