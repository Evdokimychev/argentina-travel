import type { TouristDashboardStats } from "@/types/tourist";
import { getUserFavorites } from "@/lib/favorites-store";
import { getPendingBookingsCount, getTripsCount, getUserBookings } from "@/lib/bookings-store";
import { getUserReviewsCount } from "@/lib/reviews-store";

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
