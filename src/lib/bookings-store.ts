import type { TourDetail } from "@/types";
import type { CheckoutFormState } from "@/components/tour-detail/checkout/types";
import { getCatalogSlug } from "@/lib/tour-slug";
import { getOrganizerTourListings, getOrganizerTourOwnerId } from "@/lib/organizer-tour-store";
import { getCanonicalTourBySlug } from "@/lib/tour-repository";
import {
  assertPermission,
  canBookTour,
  canCancelOwnBooking,
  canManageBooking,
} from "@/lib/permissions";
import type { SessionUser } from "@/types/user";
import {
  BOOKINGS_STORE_KEY,
  BOOKINGS_UPDATED_EVENT,
  type Booking,
  type BookingOrganizerComment,
  type BookingStatus,
  type BookingStatusActor,
  type BookingStatusChange,
  type OrganizerBookingStats,
} from "@/types/tourist";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

function readRawBookings(): Booking[] {
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

function createStatusChange(input: {
  from: BookingStatus | null;
  to: BookingStatus;
  changedBy: BookingStatusActor;
  note?: string;
}): BookingStatusChange {
  return {
    id: createId("status"),
    from: input.from,
    to: input.to,
    changedAt: new Date().toISOString(),
    changedBy: input.changedBy,
    note: input.note?.trim() || undefined,
  };
}

function resolveOrganizerTourId(tourSlug: string): string | undefined {
  const canonical = getCanonicalTourBySlug(tourSlug);
  if (canonical?.organizerTourId) return canonical.organizerTourId;

  const listing = getOrganizerTourListings().find(
    (item) => getCatalogSlug(item) === tourSlug || item.slug === tourSlug
  );
  return listing?.id;
}

function migrateLegacyStatus(status: BookingStatus): BookingStatus {
  if (status === "waiting_payment" || status === "paid") return status;
  return status;
}

export function normalizeBooking(raw: Booking): Booking {
  const touristComment = raw.touristComment?.trim() || raw.comments?.trim() || undefined;
  const status = migrateLegacyStatus(raw.status);
  const organizerComments = Array.isArray(raw.organizerComments) ? raw.organizerComments : [];
  let statusHistory = Array.isArray(raw.statusHistory) ? raw.statusHistory : [];

  if (statusHistory.length === 0) {
    statusHistory = [
      createStatusChange({
        from: null,
        to: status,
        changedBy: "system",
        note: "Миграция записи",
      }),
    ];
  }

  return {
    ...raw,
    status,
    organizerTourId: raw.organizerTourId ?? resolveOrganizerTourId(raw.tourSlug),
    touristComment,
    comments: undefined,
    organizerComments: organizerComments.map((item) => ({
      id: item.id || createId("comment"),
      text: item.text.trim(),
      authorName: item.authorName.trim() || "Организатор",
      createdAt: item.createdAt || raw.updatedAt || raw.createdAt,
    })),
    statusHistory,
  };
}

function seedDemoBookingsIfEmpty(): Booking[] {
  const existing = readRawBookings();
  if (existing.length > 0) {
    return existing.map(normalizeBooking);
  }

  const now = new Date().toISOString();
  const seeded: Booking[] = [
    {
      id: "booking-demo-new",
      userId: "ivan-evdokimychev",
      organizerTourId: "org-iguazu",
      tourId: "4",
      tourSlug: "iguazu-falls",
      tourTitle: "Водопады Игуасу за 1 день: аргентинская и бразильская стороны",
      tourImage:
        "https://images.unsplash.com/photo-1558980664-1db756751b1a?w=800&q=80",
      status: "new",
      guests: 2,
      startDate: "2026-09-12",
      endDate: "2026-09-13",
      totalPriceUsd: 1180,
      contactName: "Иван Евдокимычев",
      contactEmail: "IAEvdokimychev@ya.ru",
      contactPhone: "+79999226564",
      touristComment: "Прилетаем утренним рейсом.",
      organizerComments: [],
      statusHistory: [
        {
          id: "status-demo-new-1",
          from: null,
          to: "new",
          changedAt: now,
          changedBy: "system",
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "booking-demo-pending",
      userId: "ivan-evdokimychev",
      organizerTourId: "org-salta",
      tourId: "3",
      tourSlug: "salta-northwest",
      tourTitle: "Сальта и ХуХуй: горные деревни, виноградники и долина Калчакí",
      tourImage:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      status: "pending",
      guests: 3,
      startDate: "2026-10-05",
      endDate: "2026-10-08",
      totalPriceUsd: 2100,
      contactName: "Иван Евдокимычев",
      contactEmail: "IAEvdokimychev@ya.ru",
      contactPhone: "+79999226564",
      organizerComments: [
        {
          id: "comment-demo-1",
          text: "Проверяем наличие мест на выбранные даты.",
          authorName: "Иван Евдокимычев",
          createdAt: now,
        },
      ],
      statusHistory: [
        {
          id: "status-demo-pending-1",
          from: null,
          to: "new",
          changedAt: "2026-06-01T10:24:00.000Z",
          changedBy: "system",
        },
        {
          id: "status-demo-pending-2",
          from: "new",
          to: "pending",
          changedAt: "2026-06-01T11:00:00.000Z",
          changedBy: "organizer",
        },
      ],
      createdAt: "2026-06-01T10:24:00.000Z",
      updatedAt: now,
    },
    {
      id: "booking-demo-completed",
      userId: "ivan-evdokimychev",
      organizerTourId: "org-mendoza",
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
      organizerComments: [
        {
          id: "comment-demo-2",
          text: "Места подтверждены. Отправили программу на email.",
          authorName: "Иван Евдокимычев",
          createdAt: "2025-10-05T12:10:00.000Z",
        },
      ],
      statusHistory: [
        {
          id: "status-demo-completed-1",
          from: null,
          to: "new",
          changedAt: "2025-10-01T10:00:00.000Z",
          changedBy: "system",
        },
        {
          id: "status-demo-completed-2",
          from: "new",
          to: "pending",
          changedAt: "2025-10-02T09:00:00.000Z",
          changedBy: "organizer",
        },
        {
          id: "status-demo-completed-3",
          from: "pending",
          to: "confirmed",
          changedAt: "2025-10-05T12:10:00.000Z",
          changedBy: "organizer",
        },
        {
          id: "status-demo-completed-4",
          from: "confirmed",
          to: "completed",
          changedAt: "2025-11-06T10:00:00.000Z",
          changedBy: "organizer",
        },
      ],
      createdAt: "2025-10-01T10:00:00.000Z",
      updatedAt: "2025-11-06T10:00:00.000Z",
    },
  ];

  writeAllBookings(seeded.map(normalizeBooking));
  return seeded.map(normalizeBooking);
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

export function getOrganizerBookings(catalogSlugs: string[]): Booking[] {
  const slugSet = new Set(catalogSlugs);
  return getAllBookings()
    .filter(
      (booking) =>
        slugSet.has(booking.tourSlug) ||
        (booking.organizerTourId &&
          getOrganizerTourListings().some(
            (item) => item.id === booking.organizerTourId && slugSet.has(getCatalogSlug(item))
          ))
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getBookingById(bookingId: string): Booking | undefined {
  const booking = getAllBookings().find((item) => item.id === bookingId);
  return booking ? normalizeBooking(booking) : undefined;
}

function persistBookingUpdate(index: number, booking: Booking) {
  const all = getAllBookings();
  all[index] = normalizeBooking(booking);
  writeAllBookings(all);
  notifyUpdated();
}

export function createBooking(input: {
  actor: SessionUser | null;
  userId: string;
  tour: Pick<TourDetail, "id" | "slug" | "title" | "image">;
  guests: number;
  startDate?: string;
  endDate?: string;
  totalPriceUsd: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  touristComment?: string;
  status?: BookingStatus;
  organizerTourId?: string;
}): Booking | { error: string } {
  const allowed = assertPermission(canBookTour(input.actor));
  if ("error" in allowed) return { error: allowed.error };

  const now = new Date().toISOString();
  const status = input.status ?? "new";
  const booking: Booking = {
    id: createId("booking"),
    userId: input.userId,
    organizerTourId: input.organizerTourId ?? resolveOrganizerTourId(input.tour.slug),
    tourId: input.tour.id,
    tourSlug: input.tour.slug,
    tourTitle: input.tour.title,
    tourImage: input.tour.image,
    status,
    guests: input.guests,
    startDate: input.startDate,
    endDate: input.endDate,
    totalPriceUsd: input.totalPriceUsd,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    touristComment: input.touristComment?.trim() || undefined,
    organizerComments: [],
    statusHistory: [
      createStatusChange({
        from: null,
        to: status,
        changedBy: "system",
      }),
    ],
    createdAt: now,
    updatedAt: now,
  };

  const all = getAllBookings();
  writeAllBookings([normalizeBooking(booking), ...all]);
  notifyUpdated();
  return booking;
}

export function updateBookingStatusWithHistory(input: {
  bookingId: string;
  status: BookingStatus;
  changedBy: BookingStatusActor;
  note?: string;
  actor: SessionUser | null;
}): { booking: Booking } | { error: string } {
  const all = getAllBookings();
  const index = all.findIndex((booking) => booking.id === input.bookingId);
  if (index === -1) return { error: "Бронирование не найдено" };

  const current = normalizeBooking(all[index]);
  const tourOwnerUserId = current.organizerTourId
    ? getOrganizerTourOwnerId(current.organizerTourId)
    : undefined;

  if (input.changedBy === "organizer") {
    const allowed = assertPermission(
      canManageBooking(input.actor, {
        tourOwnerUserId,
      })
    );
    if ("error" in allowed) return { error: allowed.error };
  }

  if (current.status === input.status) {
    return { booking: current };
  }

  const updated: Booking = {
    ...current,
    status: input.status,
    updatedAt: new Date().toISOString(),
    statusHistory: [
      ...current.statusHistory,
      createStatusChange({
        from: current.status,
        to: input.status,
        changedBy: input.changedBy,
        note: input.note,
      }),
    ],
  };

  persistBookingUpdate(index, updated);
  return { booking: updated };
}

/** @deprecated Use updateBookingStatusWithHistory */
export function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  actor: SessionUser | null
): { booking: Booking } | { error: string } {
  return updateBookingStatusWithHistory({
    bookingId,
    status,
    changedBy: "organizer",
    actor,
  });
}

export function cancelBookingByTourist(
  bookingId: string,
  actor: SessionUser | null
): { booking: Booking } | { error: string } {
  const booking = getBookingById(bookingId);
  if (!booking) return { error: "Бронирование не найдено" };

  const allowed = assertPermission(canCancelOwnBooking(actor, booking.userId));
  if ("error" in allowed) return { error: allowed.error };

  if (booking.status !== "new" && booking.status !== "pending") {
    return { error: "Эту заявку нельзя отменить" };
  }

  return updateBookingStatusWithHistory({
    bookingId,
    status: "cancelled",
    changedBy: "tourist",
    actor,
  });
}

export function addOrganizerComment(input: {
  bookingId: string;
  text: string;
  authorName: string;
  actor: SessionUser | null;
}): { booking: Booking } | { error: string } {
  const trimmed = input.text.trim();
  if (!trimmed) return { error: "Введите текст комментария" };

  const all = getAllBookings();
  const index = all.findIndex((booking) => booking.id === input.bookingId);
  if (index === -1) return { error: "Бронирование не найдено" };

  const current = normalizeBooking(all[index]);
  const tourOwnerUserId = current.organizerTourId
    ? getOrganizerTourOwnerId(current.organizerTourId)
    : undefined;

  const allowed = assertPermission(
    canManageBooking(input.actor, { tourOwnerUserId })
  );
  if ("error" in allowed) return { error: allowed.error };

  const comment: BookingOrganizerComment = {
    id: createId("comment"),
    text: trimmed,
    authorName: input.authorName.trim() || "Организатор",
    createdAt: new Date().toISOString(),
  };

  const updated: Booking = {
    ...current,
    updatedAt: comment.createdAt,
    organizerComments: [comment, ...current.organizerComments],
  };

  persistBookingUpdate(index, updated);
  return { booking: updated };
}

export function createBookingFromCheckout(input: {
  actor: SessionUser | null;
  userId: string;
  tour: TourDetail;
  guests: number;
  startDate?: string;
  endDate?: string;
  totalPriceUsd: number;
  form: CheckoutFormState;
}): Booking | { error: string } {
  return createBooking({
    actor: input.actor,
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
    touristComment: input.form.comments,
    status: "new",
    organizerTourId: resolveOrganizerTourId(input.tour.slug),
  });
}

export function getPendingBookingsCount(userId: string): number {
  return getUserBookings(userId).filter(
    (booking) => booking.status === "new" || booking.status === "pending"
  ).length;
}

export function getTripsCount(userId: string): number {
  return getUserBookings(userId).filter(
    (booking) => booking.status === "confirmed" || booking.status === "completed"
  ).length;
}

export function getOrganizerBookingStats(catalogSlugs: string[]): OrganizerBookingStats {
  const bookings = getOrganizerBookings(catalogSlugs);

  const newCount = bookings.filter((b) => b.status === "new").length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;

  return {
    newCount,
    pendingCount,
    confirmedCount,
    completedCount,
    cancelledCount,
    activeInboxCount: newCount + pendingCount,
  };
}
