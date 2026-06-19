import { getUserReviews } from "@/lib/reviews-store";
import type { Booking } from "@/types/tourist";

function isPastBooking(booking: Booking, now = new Date()): boolean {
  if (booking.status === "completed") return true;
  if (booking.status !== "confirmed" || !booking.endDate) return false;
  const end = new Date(`${booking.endDate}T23:59:59`);
  return end.getTime() < now.getTime();
}

function hasPublishedReviewForBooking(
  booking: Booking,
  userId: string
): boolean {
  return getUserReviews(userId).some(
    (review) =>
      review.status === "published" &&
      (review.bookingId === booking.id || review.tourSlug === booking.tourSlug)
  );
}

export function bookingNeedsReview(booking: Booking, userId: string): boolean {
  if (!isPastBooking(booking)) return false;
  return !hasPublishedReviewForBooking(booking, userId);
}

export function buildReviewHref(booking: Pick<Booking, "tourSlug">): string {
  return `/tours/${booking.tourSlug}?review=1#reviews`;
}

export function countBookingsNeedingReview(userId: string, bookings: Booking[]): number {
  return bookings.filter((booking) => bookingNeedsReview(booking, userId)).length;
}
