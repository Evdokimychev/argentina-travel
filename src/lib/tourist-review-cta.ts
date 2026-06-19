import type { Booking } from "@/types/tourist";
import type { TouristReview } from "@/types/tourist";
import { bookingNeedsReviewFromData, isPastBooking } from "@/lib/review-eligibility";
import { getUserReviews } from "@/lib/reviews-store";

function hasPublishedReviewForBooking(
  booking: Booking,
  userId: string,
  reviews?: TouristReview[]
): boolean {
  const userReviews = reviews ?? getUserReviews(userId);
  return userReviews.some(
    (review) =>
      review.status === "published" &&
      (review.bookingId === booking.id || review.tourSlug === booking.tourSlug)
  );
}

export { isPastBooking };

export function bookingNeedsReview(
  booking: Booking,
  userId: string,
  reviews?: TouristReview[]
): boolean {
  if (reviews?.length) {
    return bookingNeedsReviewFromData(booking, reviews);
  }
  return isPastBooking(booking) && !hasPublishedReviewForBooking(booking, userId);
}

export function buildReviewHref(booking: Pick<Booking, "tourSlug">): string {
  return `/tours/${booking.tourSlug}?review=1#leave-review`;
}

export function countBookingsNeedingReview(userId: string, bookings: Booking[]): number {
  return bookings.filter((booking) => bookingNeedsReview(booking, userId)).length;
}
