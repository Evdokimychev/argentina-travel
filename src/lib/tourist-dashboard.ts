import type { Booking, TouristDashboardStats, TouristReview } from "@/types/tourist";
import { getUserFavorites } from "@/lib/favorites-store";
import { getPendingBookingsCount, getTripsCount, getUserBookings } from "@/lib/bookings-store";
import { getUserReviews, getUserReviewsCount } from "@/lib/reviews-store";
import { getUnreadNotificationsCount } from "@/lib/notifications";
import { bookingNeedsReview } from "@/lib/tourist-review-cta";

export function getTouristDashboardStats(userId: string): TouristDashboardStats {
  return {
    tripsCount: getTripsCount(userId),
    favoritesCount: getUserFavorites(userId).length,
    pendingBookingsCount: getPendingBookingsCount(userId),
    reviewsCount: getUserReviewsCount(userId),
  };
}

export function getRecentBookings(userId: string, limit = 3) {
  return getUserBookings(userId).slice(0, limit);
}

function isUpcomingBooking(booking: Booking, now = Date.now()): boolean {
  if (booking.status !== "confirmed" && booking.status !== "completed") return false;
  if (!booking.startDate) return false;

  const start = new Date(`${booking.startDate}T00:00:00`).getTime();
  return start >= now - 86_400_000;
}

export function getNextUpcomingBooking(userId: string): Booking | null {
  const bookings = getUserBookings(userId).filter((booking) => booking.status !== "cancelled");

  const upcoming = bookings
    .filter(isUpcomingBooking)
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));

  if (upcoming.length > 0) {
    return upcoming[0];
  }

  const active = bookings
    .filter((booking) =>
      booking.status === "new" ||
      booking.status === "pending" ||
      booking.status === "confirmed"
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return active[0] ?? null;
}

export function getPendingReviewsCount(
  userId: string,
  bookings: Booking[],
  reviews?: TouristReview[]
): number {
  const userReviews = reviews ?? getUserReviews(userId);
  return bookings.filter((booking) => bookingNeedsReview(booking, userId, userReviews)).length;
}

export function getTouristDashboardOverview(input: {
  userId: string;
  contactEmail?: string;
  reviews?: TouristReview[];
}) {
  const bookings = getUserBookings(input.userId);

  return {
    stats: getTouristDashboardStats(input.userId),
    nextBooking: getNextUpcomingBooking(input.userId),
    pendingReviewsCount: getPendingReviewsCount(
      input.userId,
      bookings,
      input.reviews
    ),
    unreadNotificationsCount: getUnreadNotificationsCount({
      userId: input.userId,
      contactEmail: input.contactEmail,
    }),
  };
}
