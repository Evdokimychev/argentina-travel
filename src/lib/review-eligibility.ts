import type { Booking, TouristReview } from "@/types/tourist";

export type ReviewEligibilityReason =
  | "not_logged_in"
  | "partner_tour"
  | "no_booking"
  | "already_published"
  | "pending_review";

export type ReviewEligibilityResult = {
  eligible: boolean;
  reason?: ReviewEligibilityReason;
  message: string;
  bookingId?: string;
  tripDate?: string;
  existingReview?: TouristReview;
};

export function isPastBooking(booking: Booking, now = new Date()): boolean {
  if (booking.status === "completed") return true;
  if (booking.status !== "confirmed") return false;

  const endDate = booking.endDate ?? booking.startDate;
  if (!endDate) return false;

  const end = new Date(`${endDate}T23:59:59`);
  return end.getTime() < now.getTime();
}

function resolveEligibleBooking(bookings: Booking[], tourSlug: string): Booking | null {
  const normalizedSlug = tourSlug.trim();
  if (!normalizedSlug) return null;

  const matches = bookings.filter((booking) => booking.tourSlug === normalizedSlug && isPastBooking(booking));
  if (!matches.length) return null;

  return matches.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

function resolveExistingReviewForTour(reviews: TouristReview[], tourSlug: string): TouristReview | null {
  const normalizedSlug = tourSlug.trim();
  if (!normalizedSlug) return null;

  return (
    reviews
      .filter((review) => review.tourSlug === normalizedSlug)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
  );
}

export function resolveReviewEligibility(input: {
  tourSlug: string;
  bookings: Booking[];
  reviews: TouristReview[];
  isPartnerTour?: boolean;
}): ReviewEligibilityResult {
  if (input.isPartnerTour) {
    return {
      eligible: false,
      reason: "partner_tour",
      message: "Отзывы на партнёрские туры оставляются на стороне организатора.",
    };
  }

  const existingReview = resolveExistingReviewForTour(input.reviews, input.tourSlug);
  if (existingReview?.status === "published") {
    return {
      eligible: false,
      reason: "already_published",
      message: "Вы уже опубликовали отзыв об этом туре.",
      existingReview,
    };
  }

  if (existingReview?.status === "pending") {
    return {
      eligible: false,
      reason: "pending_review",
      message: "Отзыв на модерации — мы сообщим, когда он появится на сайте.",
      existingReview,
    };
  }

  const booking = resolveEligibleBooking(input.bookings, input.tourSlug);
  if (!booking) {
    return {
      eligible: false,
      reason: "no_booking",
      message: "Оставить отзыв можно после завершённой поездки по этому туру.",
      existingReview: existingReview ?? undefined,
    };
  }

  if (existingReview && (existingReview.status === "draft" || existingReview.status === "rejected")) {
    return {
      eligible: true,
      message: "Допишите отзыв и отправьте его на модерацию.",
      bookingId: existingReview.bookingId ?? booking.id,
      tripDate: existingReview.tripDate ?? booking.endDate ?? booking.startDate,
      existingReview,
    };
  }

  return {
    eligible: true,
    message: "Поделитесь впечатлениями — отзыв появится на странице тура после модерации.",
    bookingId: booking.id,
    tripDate: booking.endDate ?? booking.startDate,
  };
}

export function bookingNeedsReviewFromData(
  booking: Booking,
  reviews: TouristReview[]
): boolean {
  if (!isPastBooking(booking)) return false;

  const hasPublished = reviews.some(
    (review) =>
      review.status === "published" &&
      (review.bookingId === booking.id || review.tourSlug === booking.tourSlug)
  );
  if (hasPublished) return false;

  const hasPending = reviews.some(
    (review) =>
      review.status === "pending" &&
      (review.bookingId === booking.id || review.tourSlug === booking.tourSlug)
  );
  return !hasPending;
}
