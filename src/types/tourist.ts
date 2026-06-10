import type { BookingInvoice, BookingPaymentSummary } from "@/types/booking-payment";
import type {
  BookingCheckoutPaymentOption,
  BookingOrganizerParams,
  BookingPaymentStatus,
} from "@/types/booking-params";

/** Active CRM statuses (Phase D v1 UI). */
export type BookingStatusActive =
  | "new"
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

/** Reserved for future payment integration — not shown in Phase D v1 UI. */
export type BookingStatusFuture = "waiting_payment" | "paid";

export type BookingStatus = BookingStatusActive | BookingStatusFuture;

export type BookingStatusActor = "organizer" | "tourist" | "system";

export interface BookingStatusChange {
  id: string;
  from: BookingStatus | null;
  to: BookingStatus;
  changedAt: string;
  changedBy: BookingStatusActor;
  note?: string;
}

export interface BookingOrganizerComment {
  id: string;
  text: string;
  authorName: string;
  createdAt: string;
}

/** Participant details for tour booking processing. */
export interface BookingTraveler {
  id: string;
  fullName: string;
  /** ISO date YYYY-MM-DD */
  dateOfBirth: string;
  passportNumber?: string;
  dietaryRestrictions?: string;
  email?: string;
  phone?: string;
}

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
  organizerTourId?: string;
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
  /** Comment from tourist at checkout. */
  touristComment?: string;
  /** @deprecated Use touristComment — migrated on read. */
  comments?: string;
  organizerComments: BookingOrganizerComment[];
  statusHistory: BookingStatusChange[];
  /** Checkout: tourist chose to fill participant data later. */
  fillTravelersLater?: boolean;
  /** Participant details (from checkout or travelers form). */
  travelers?: BookingTraveler[];
  /** Public token for /booking/travelers/[token] form. */
  travelersFormToken?: string;
  /** When participant data was submitted. */
  travelersCompletedAt?: string;
  /** Payment invoices (optional until payment integration). */
  invoices?: BookingInvoice[];
  /** Aggregated payment totals (optional until payment integration). */
  paymentSummary?: BookingPaymentSummary;
  /** Organizer-editable payment status (UI stub until payment integration). */
  paymentStatus?: BookingPaymentStatus;
  /** Organizer-editable booking parameters (dates, pricing, prepayment). */
  organizerParams?: BookingOrganizerParams;
  /** Payment choice at checkout (full / deposit / pay later). */
  checkoutPaymentOption?: BookingCheckoutPaymentOption;
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

export interface OrganizerBookingStats {
  newCount: number;
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  activeInboxCount: number;
}

export const FAVORITES_STORE_KEY = "argentina-travel-favorites";
export const BOOKINGS_STORE_KEY = "argentina-travel-bookings";
export const REVIEWS_STORE_KEY = "argentina-travel-reviews";

export const FAVORITES_UPDATED_EVENT = "tourist-favorites-updated";
export const BOOKINGS_UPDATED_EVENT = "tourist-bookings-updated";
export const REVIEWS_UPDATED_EVENT = "tourist-reviews-updated";
