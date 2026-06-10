import { getAllCanonicalTours } from "@/lib/tour-repository";
import type { Testimonial, TourReview } from "@/types";

function reviewToTestimonial(
  review: TourReview,
  tourSlug: string,
  tourTitle: string,
  region: string
): Testimonial {
  return {
    id: `${tourSlug}-${review.id}`,
    name: review.author,
    location: region,
    text: review.text,
    rating: review.rating,
    tourSlug,
    tourTitle,
    verifiedTrip: review.verifiedTrip === true,
  };
}

/** Top verified tour reviews for homepage — no static fake names. */
export function collectTopVerifiedReviews(limit = 3): Testimonial[] {
  const collected: Testimonial[] = [];

  for (const tour of getAllCanonicalTours()) {
    if (tour.status !== "published") continue;

    for (const review of tour.social.reviews) {
      if (review.verifiedTrip !== true) continue;
      collected.push(
        reviewToTestimonial(review, tour.slug, tour.title, tour.geography.region)
      );
    }
  }

  return collected
    .sort((a, b) => b.rating - a.rating || b.text.length - a.text.length)
    .slice(0, limit);
}

export function hasVerifiedReviewsForHomepage(): boolean {
  return collectTopVerifiedReviews(1).length > 0;
}
