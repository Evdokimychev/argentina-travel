import type { TourDetail } from "@/types";
import type { CheckoutFormState } from "@/components/tour-detail/checkout/types";
import {
  BOOKINGS_STORE_KEY,
  BOOKINGS_UPDATED_EVENT,
  type Booking,
  type BookingStatus,
} from "@/types/tourist";

function createBookingId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `booking-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `booking-${Date.now().toString(36)}`;
}

function readAllBookings(): Booking[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BOOKINGS_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Booking[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAllBookings(bookings: Booking[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BOOKINGS_STORE_KEY, JSON.stringify(bookings));
}

function notifyUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(BOOKINGS_UPDATED_EVENT));
  }
}

function seedDemoBookingsIfEmpty(): Booking[] {
  const existing = readAllBookings();
  if (existing.length > 0) return existing;

  const now = new Date().toISOString();
  const seeded: Booking[] = [
    {
      id: "booking-demo-pending",
      userId: "ivan-evdokimychev",
      tourId: "4",
      tourSlug: "iguazu-falls",
      tourTitle: "Водопады Игуасу за 1 день: аргентинская и бразильская стороны",
      tourImage:
        "https://images.unsplash.com/photo-1558980664-1db756751b1a?w=800&q=80",
      status: "pending",
      guests: 2,
      startDate: "2026-09-12",
      endDate: "2026-09-13",
      totalPriceUsd: 1180,
      contactName: "Иван Евдокимычев",
      contactEmail: "IAEvdokimychev@ya.ru",
      contactPhone: "+79999226564",
      comments: "Прилетаем утренним рейсом.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "booking-demo-completed",
      userId: "ivan-evdokimychev",
      tourId: "2",
      tourSlug: "mendoza-wine",
      tourTitle: "Мендоса: винные маршруты, Аконкагуа и гастрономические ужины",
      tourImage:
        "https://images.unsplash.com/photo-1506377247377-2ecb89819a88?w=800&q=80",
      status: "completed",
      guests: 2,
      startDate: "2025-11-03",
      endDate: "2025-11-05",
      totalPriceUsd: 1560,
      contactName: "Иван Евдокимычев",
      contactEmail: "IAEvdokimychev@ya.ru",
      contactPhone: "+79999226564",
      createdAt: "2025-10-01T10:00:00.000Z",
      updatedAt: "2025-11-06T10:00:00.000Z",
    },
  ];

  writeAllBookings(seeded);
  return seeded;
}

export function getAllBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  return seedDemoBookingsIfEmpty();
}

export function getUserBookings(userId: string): Booking[] {
  return getAllBookings()
    .filter((booking) => booking.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getBookingById(bookingId: string): Booking | undefined {
  return getAllBookings().find((booking) => booking.id === bookingId);
}

export function createBooking(input: {
  userId: string;
  tour: Pick<TourDetail, "id" | "slug" | "title" | "image">;
  guests: number;
  startDate?: string;
  endDate?: string;
  totalPriceUsd: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  comments?: string;
  status?: BookingStatus;
}): Booking {
  const now = new Date().toISOString();
  const booking: Booking = {
    id: createBookingId(),
    userId: input.userId,
    tourId: input.tour.id,
    tourSlug: input.tour.slug,
    tourTitle: input.tour.title,
    tourImage: input.tour.image,
    status: input.status ?? "pending",
    guests: input.guests,
    startDate: input.startDate,
    endDate: input.endDate,
    totalPriceUsd: input.totalPriceUsd,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    comments: input.comments?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  const all = getAllBookings();
  writeAllBookings([booking, ...all]);
  notifyUpdated();
  return booking;
}

export function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): { booking: Booking } | { error: string } {
  const all = getAllBookings();
  const index = all.findIndex((booking) => booking.id === bookingId);
  if (index === -1) return { error: "Бронирование не найдено" };

  const updated: Booking = {
    ...all[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  all[index] = updated;
  writeAllBookings(all);
  notifyUpdated();
  return { booking: updated };
}

export function createBookingFromCheckout(input: {
  userId: string;
  tour: TourDetail;
  guests: number;
  startDate?: string;
  endDate?: string;
  totalPriceUsd: number;
  form: CheckoutFormState;
}): Booking {
  return createBooking({
    userId: input.userId,
    tour: input.tour,
    guests: input.guests,
    startDate: input.startDate,
    endDate: input.endDate,
    totalPriceUsd: input.totalPriceUsd,
    contactName: [input.form.contactFirstName, input.form.contactLastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" "),
    contactEmail: input.form.contactEmail.trim(),
    contactPhone: input.form.contactPhone.trim(),
    comments: input.form.comments,
    status: "pending",
  });
}

export function getPendingBookingsCount(userId: string): number {
  return getUserBookings(userId).filter((booking) => booking.status === "pending").length;
}

export function getTripsCount(userId: string): number {
  return getUserBookings(userId).filter(
    (booking) => booking.status === "confirmed" || booking.status === "completed"
  ).length;
}
