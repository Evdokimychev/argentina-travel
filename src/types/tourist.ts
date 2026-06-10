/** Tourist cabinet — localStorage-backed entities (Phase C). */

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type TouristReviewStatus = "draft" | "published";

export interface FavoriteTour {
  tourId: string;
  tourSlug: string;
  tourTitle: string;
  tourImage: string;
  region?: string;
  country?: string;
  priceUsd?: number;
  addedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  tourId: string;
  tourSlug: string;
  tourTitle: string;
  tourImage: string;
  status: BookingStatus;
  guests: number;
  startDate?: string;
  endDate?: string;
  totalPriceUsd: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TouristReview {
  id: string;
  userId: string;
  tourId: string;
  tourSlug: string;
  tourTitle: string;
  bookingId?: string;
  rating: number;
  text: string;
  photos: string[];
  tripDate?: string;
  status: TouristReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TouristDashboardStats {
  tripsCount: number;
  favoritesCount: number;
  pendingBookingsCount: number;
  reviewsCount: number;
}

export const FAVORITES_STORE_KEY = "argentina-travel-favorites";
export const BOOKINGS_STORE_KEY = "argentina-travel-bookings";
export const REVIEWS_STORE_KEY = "argentina-travel-reviews";

export const FAVORITES_UPDATED_EVENT = "tourist-favorites-updated";
export const BOOKINGS_UPDATED_EVENT = "tourist-bookings-updated";
export const REVIEWS_UPDATED_EVENT = "tourist-reviews-updated";
