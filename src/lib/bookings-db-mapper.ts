import type { Json } from "@/types/database";
import type { BookingPaymentStatus } from "@/types/booking-params";
import type {
  Booking,
  BookingOrganizerComment,
  BookingStatus,
  BookingStatusChange,
  BookingTraveler,
} from "@/types/tourist";
import { guestUserIdFromEmail, isGuestUserId } from "@/lib/guest-booking";
import { getOrganizerTourOwnerId } from "@/lib/organizer-tour-store";
import { DEFAULT_ORGANIZER_OWNER_ID } from "@/types/user";

export type BookingRow = {
  id: string;
  user_id: string | null;
  guest_user_id: string | null;
  organizer_user_id: string | null;
  tour_id: string;
  tour_slug: string;
  tour_title: string;
  tour_image: string;
  status: string;
  guests: number;
  total_price_usd: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  start_date: string | null;
  end_date: string | null;
  payment_status: string | null;
  payload: Json;
  created_at: string;
  updated_at: string;
};

export type BookingPayload = {
  organizerTourId?: string;
  touristComment?: string;
  organizerComments?: BookingOrganizerComment[];
  statusHistory?: BookingStatusChange[];
  fillTravelersLater?: boolean;
  travelers?: BookingTraveler[];
  travelersFormToken?: string;
  travelersCompletedAt?: string;
  invoices?: Booking["invoices"];
  paymentSummary?: Booking["paymentSummary"];
  paymentLink?: Booking["paymentLink"];
  organizerParams?: Booking["organizerParams"];
  checkoutPaymentOption?: Booking["checkoutPaymentOption"];
  amountDue?: number;
  amountPaid?: number;
  paymentLinkToken?: string;
  paymentLinkExpiresAt?: string;
};

function parsePayload(raw: Json): BookingPayload {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as BookingPayload;
}

function resolveOrganizerUserId(booking: Booking): string {
  if (booking.organizerTourId) {
    return getOrganizerTourOwnerId(booking.organizerTourId) ?? DEFAULT_ORGANIZER_OWNER_ID;
  }
  return DEFAULT_ORGANIZER_OWNER_ID;
}

export function bookingToRow(booking: Booking): Omit<BookingRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
} {
  const guest = isGuestUserId(booking.userId);
  const payload: BookingPayload = {
    organizerTourId: booking.organizerTourId,
    touristComment: booking.touristComment,
    organizerComments: booking.organizerComments,
    statusHistory: booking.statusHistory,
    fillTravelersLater: booking.fillTravelersLater,
    travelers: booking.travelers,
    travelersFormToken: booking.travelersFormToken,
    travelersCompletedAt: booking.travelersCompletedAt,
    invoices: booking.invoices,
    paymentSummary: booking.paymentSummary,
    paymentLink: booking.paymentLink,
    organizerParams: booking.organizerParams,
    checkoutPaymentOption: booking.checkoutPaymentOption,
    amountDue: booking.amountDue,
    amountPaid: booking.amountPaid,
    paymentLinkToken: booking.paymentLinkToken,
    paymentLinkExpiresAt: booking.paymentLinkExpiresAt,
  };

  return {
    id: booking.id,
    user_id: guest ? null : booking.userId,
    guest_user_id: guest ? booking.userId : null,
    organizer_user_id: resolveOrganizerUserId(booking),
    tour_id: booking.tourId,
    tour_slug: booking.tourSlug,
    tour_title: booking.tourTitle,
    tour_image: booking.tourImage,
    status: booking.status,
    guests: booking.guests,
    total_price_usd: booking.totalPriceUsd,
    contact_name: booking.contactName,
    contact_email: booking.contactEmail,
    contact_phone: booking.contactPhone,
    start_date: booking.startDate ?? null,
    end_date: booking.endDate ?? null,
    payment_status: booking.paymentStatus ?? null,
    payload: payload as Json,
    created_at: booking.createdAt,
    updated_at: booking.updatedAt,
  };
}

export function rowToBooking(row: BookingRow): Booking {
  const payload = parsePayload(row.payload);
  const userId = row.user_id ?? row.guest_user_id ?? guestUserIdFromEmail(row.contact_email);

  return {
    id: row.id,
    userId,
    organizerTourId: payload.organizerTourId,
    tourId: row.tour_id,
    tourSlug: row.tour_slug,
    tourTitle: row.tour_title,
    tourImage: row.tour_image,
    status: row.status as BookingStatus,
    guests: row.guests,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    totalPriceUsd: Number(row.total_price_usd),
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    touristComment: payload.touristComment,
    organizerComments: payload.organizerComments ?? [],
    statusHistory: payload.statusHistory ?? [],
    fillTravelersLater: payload.fillTravelersLater,
    travelers: payload.travelers,
    travelersFormToken: payload.travelersFormToken,
    travelersCompletedAt: payload.travelersCompletedAt,
    invoices: payload.invoices,
    paymentSummary: payload.paymentSummary,
    paymentStatus: (row.payment_status as BookingPaymentStatus | null) ?? undefined,
    organizerParams: payload.organizerParams,
    checkoutPaymentOption: payload.checkoutPaymentOption,
    paymentLink: payload.paymentLink,
    amountDue: payload.amountDue,
    amountPaid: payload.amountPaid,
    paymentLinkToken: payload.paymentLinkToken,
    paymentLinkExpiresAt: payload.paymentLinkExpiresAt,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowsToBookings(rows: BookingRow[]): Booking[] {
  return rows.map(rowToBooking);
}
