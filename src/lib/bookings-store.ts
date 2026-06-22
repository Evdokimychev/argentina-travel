import type { BookingAttribution } from "@/types/booking-attribution";
import type { TourDetail } from "@/types";
import type { CheckoutFormState } from "@/components/tour-detail/checkout/types";
import { shouldSeedDemoData } from "@/lib/demo-mode";
import { isRemoteBookingsMode, apiAttachGuestBookings, apiCreateBooking } from "@/lib/bookings-api";
import {
  ensureTravelersSlotCount,
  hasCompleteBookingTravelers,
  travelersFromCheckoutForm,
} from "@/lib/booking-travelers";
import {
  buildPaymentSummaryFromStatus,
  computePrepaymentAmount,
  normalizeBookingPaymentStatus,
  normalizeOrganizerParams,
  resolveBookingPaymentStatus,
  resolveOrganizerParams,
} from "@/lib/booking-params";
import {
  buildCheckoutDisplaySnapshot,
  type CheckoutCurrencyCode,
} from "@/lib/payments/checkout-currency";
import type { CurrencyCode } from "@/types/locale";
import type { BookingCheckoutPaymentOption } from "@/types/booking-params";
import type { BookingPaymentLinkTarget } from "@/types/booking-payment";
import { formatBookingDisplayNumber } from "@/lib/booking-display";
import {
  createBookingPaymentLinkRecord,
  isBookingPaymentLinkExpired,
  buildBookingPaymentLinkUrl,
} from "@/lib/booking-payment-link";
import { resolveBookingInvoices } from "@/lib/booking-payment";
import type { BookingInvoice } from "@/types/booking-payment";
import { tourCover } from "@/lib/seed-media";
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
  type BookingTraveler,
  type OrganizerBookingStats,
} from "@/types/tourist";
import type { BookingOrganizerParams, BookingPaymentStatus } from "@/types/booking-params";
import {
  notifyBookingCreatedEmail,
  notifyPaymentReceivedEmail,
} from "@/lib/bookings-notify-client";
import {
  notifyBookingCreated,
  notifyPaymentReminder,
  notifyPaymentStatusChanged,
  notifyPayLaterAcknowledged,
  notifyTravelersFormDue,
} from "@/lib/notifications";
import {
  bookingMatchesContactEmail,
  guestUserIdFromEmail,
  isGuestUserId,
  normalizeContactEmail,
} from "@/lib/guest-booking";
import {
  buildDefaultTripTasks,
  ensureTripOperations,
  normalizeBookingSource,
  normalizeTripOperations,
  resolveClientPortalToken,
  mergeTripOperationsWithClientUpdates,
  appendTripClientUpdates,
} from "@/lib/trip-operations";
import { buildTripsterIguazuDemoOperations } from "@/data/trip-operations-seeds";
import type { BookingSource, TripClientRequirements, TripOperations } from "@/types/trip-operations";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

function syncPaymentDenormalizedFields(booking: Booking): Booking {
  const organizerParams = booking.organizerParams
    ? normalizeOrganizerParams(booking.organizerParams)
    : resolveOrganizerParams(booking);
  const paymentStatus = booking.paymentStatus
    ? normalizeBookingPaymentStatus(booking.paymentStatus)
    : resolveBookingPaymentStatus(booking);
  const paymentSummary =
    booking.paymentSummary ??
    buildPaymentSummaryFromStatus(booking.totalPriceUsd, paymentStatus, organizerParams);

  return {
    ...booking,
    paymentStatus,
    paymentSummary,
    organizerParams: booking.organizerParams ?? organizerParams,
  };
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

function resolveTravelersFormToken(raw: Pick<Booking, "id" | "travelersFormToken">): string {
  if (raw.travelersFormToken) return raw.travelersFormToken;
  let hash = 0;
  for (let i = 0; i < raw.id.length; i += 1) {
    hash = (hash * 33 + raw.id.charCodeAt(i)) >>> 0;
  }
  return `trv-${hash.toString(36).slice(0, 12)}`;
}

function normalizeTravelers(raw: BookingTraveler[] | undefined): BookingTraveler[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((traveler, index) => ({
    id: traveler.id || createId(`guest-${index}`),
    fullName: traveler.fullName?.trim() ?? "",
    dateOfBirth: traveler.dateOfBirth?.trim() ?? "",
    passportNumber: traveler.passportNumber?.trim() || undefined,
    dietaryRestrictions: traveler.dietaryRestrictions?.trim() || undefined,
    email: traveler.email?.trim() || undefined,
    phone: traveler.phone?.trim() || undefined,
  }));
}

export function createStatusChange(input: {
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

  return syncPaymentDenormalizedFields({
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
    fillTravelersLater: raw.fillTravelersLater ?? false,
    travelers: normalizeTravelers(raw.travelers),
    travelersFormToken: resolveTravelersFormToken(raw),
    travelersCompletedAt: raw.travelersCompletedAt,
    organizerParams: raw.organizerParams
      ? normalizeOrganizerParams(raw.organizerParams)
      : undefined,
    paymentStatus: raw.paymentStatus
      ? normalizeBookingPaymentStatus(raw.paymentStatus)
      : undefined,
    paymentLink: raw.paymentLink,
    checkoutPaymentOption: raw.checkoutPaymentOption,
    bookingSource: normalizeBookingSource(raw.bookingSource),
    externalReference: raw.externalReference?.trim() || undefined,
    clientPortalToken: resolveClientPortalToken({
      id: raw.id,
      clientPortalToken: raw.clientPortalToken,
    }),
    tripOperations: normalizeTripOperations(raw.tripOperations),
    metadata: raw.metadata,
  });
}

function seedDemoBookingsIfEmpty(): Booking[] {
  const existing = readRawBookings();
  if (existing.length > 0) {
    return existing.map(normalizeBooking);
  }

  if (!shouldSeedDemoData()) {
    return [];
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
      tourImage: tourCover("iguazu-falls"),
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
      fillTravelersLater: true,
      travelersFormToken: "trv-demo-new",
    },
    {
      id: "booking-demo-pending",
      userId: "ivan-evdokimychev",
      organizerTourId: "org-salta",
      tourId: "3",
      tourSlug: "salta-northwest",
      tourTitle: "Сальта и ХуХуй: горные деревни, виноградники и долина Калчакí",
      tourImage: tourCover("salta-northwest"),
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
      fillTravelersLater: true,
      travelersFormToken: "trv-demo-pending",
    },
    {
      id: "booking-demo-completed",
      userId: "ivan-evdokimychev",
      organizerTourId: "org-mendoza",
      tourId: "2",
      tourSlug: "mendoza-wine",
      tourTitle: "Мендоса: винные маршруты, Аконкагуа и гастрономические ужины",
      tourImage: tourCover("mendoza-wine"),
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
      fillTravelersLater: false,
      travelersFormToken: "trv-demo-completed",
      travelersCompletedAt: "2025-10-08T14:30:00.000Z",
      travelers: [
        {
          id: "guest-1",
          fullName: "Иван Евдокимычев",
          dateOfBirth: "1990-05-15",
          passportNumber: "4510 123456",
          dietaryRestrictions: "Без ограничений",
          email: "IAEvdokimychev@ya.ru",
          phone: "+79999226564",
        },
        {
          id: "guest-2",
          fullName: "Мария Евдокимычева",
          dateOfBirth: "1992-08-22",
          passportNumber: "4511 654321",
          dietaryRestrictions: "Без глютена",
          email: "maria@example.com",
          phone: "+79991234567",
        },
      ],
    },
    {
      id: "booking-demo-tripster",
      userId: guestUserIdFromEmail("anna.k.demo@example.com"),
      organizerTourId: "org-iguazu",
      tourId: "4",
      tourSlug: "iguazu-falls",
      tourTitle: "Индивидуальный тур: водопады Игуасу (2 дня)",
      tourImage: tourCover("iguazu-falls"),
      status: "confirmed",
      guests: 2,
      startDate: "2026-09-12",
      endDate: "2026-09-13",
      totalPriceUsd: 890,
      contactName: "Анна и Михаил К.",
      contactEmail: "anna.k.demo@example.com",
      contactPhone: "+7 916 555-12-34",
      touristComment: "Бронирование с Tripster, нужен ранний выезд к парку.",
      organizerComments: [
        {
          id: "comment-tripster-1",
          text: "Билеты на аргентинскую сторону куплены. Ждём решение по бразильской.",
          authorName: "Иван Евдокимычев",
          createdAt: now,
        },
      ],
      statusHistory: [
        {
          id: "status-tripster-1",
          from: null,
          to: "new",
          changedAt: "2026-06-08T08:00:00.000Z",
          changedBy: "system",
          note: "Импорт с Tripster",
        },
        {
          id: "status-tripster-2",
          from: "new",
          to: "confirmed",
          changedAt: "2026-06-09T11:00:00.000Z",
          changedBy: "organizer",
        },
      ],
      createdAt: "2026-06-08T08:00:00.000Z",
      updatedAt: now,
      bookingSource: "tripster",
      externalReference: "TS-88421",
      clientPortalToken: "trip-demo-iguazu",
      travelersFormToken: "trv-demo-tripster",
      fillTravelersLater: true,
      tripOperations: buildTripsterIguazuDemoOperations(now),
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

export { guestUserIdFromEmail };

export function getBookingsByContactEmail(email: string): Booking[] {
  const normalized = normalizeContactEmail(email);
  if (!normalized) return [];

  return getAllBookings()
    .filter((booking) => bookingMatchesContactEmail(booking, normalized))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function attachGuestBookingsToUser(userId: string, email: string): number {
  if (isRemoteBookingsMode()) {
    void apiAttachGuestBookings().then(() => notifyUpdated());
    return 0;
  }

  const normalized = normalizeContactEmail(email);
  if (!normalized || isGuestUserId(userId)) return 0;

  const guestId = guestUserIdFromEmail(normalized);
  const all = getAllBookings();
  let attached = 0;

  const updated = all.map((raw) => {
    const booking = normalizeBooking(raw);
    const matchesGuest =
      booking.userId === guestId || bookingMatchesContactEmail(booking, normalized);

    if (!matchesGuest || booking.userId === userId) return booking;

    attached += 1;
    return normalizeBooking({ ...booking, userId, updatedAt: new Date().toISOString() });
  });

  if (attached > 0) {
    writeAllBookings(updated);
    notifyUpdated();
  }

  return attached;
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
  fillTravelersLater?: boolean;
  travelers?: BookingTraveler[];
  travelersFormToken?: string;
  travelersCompletedAt?: string;
  checkoutPaymentOption?: BookingCheckoutPaymentOption;
  /** Allow checkout without login when contact email is provided. */
  allowGuestRequest?: boolean;
  priceQuoteRequest?: boolean;
  /** When false, return booking without writing to localStorage (Supabase path). */
  persist?: boolean;
}): Booking | { error: string } {
  if (input.allowGuestRequest) {
    if (!input.contactEmail.trim()) {
      return { error: "Укажите email для заявки" };
    }
  } else {
    const allowed = assertPermission(canBookTour(input.actor));
    if ("error" in allowed) return { error: allowed.error };
  }

  const now = new Date().toISOString();
  const status = input.status ?? "new";
  const id = createId("booking");
  const booking: Booking = {
    id,
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
    priceQuoteRequest: input.priceQuoteRequest ?? false,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    touristComment: input.touristComment?.trim() || undefined,
    fillTravelersLater: input.fillTravelersLater ?? false,
    travelers: normalizeTravelers(input.travelers),
    travelersFormToken: input.travelersFormToken ?? resolveTravelersFormToken({ id }),
    travelersCompletedAt: input.travelersCompletedAt,
    checkoutPaymentOption: input.checkoutPaymentOption,
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
  const normalized = normalizeBooking(booking);
  if (input.persist === false) {
    notifyBookingCreated(normalized);
    void notifyBookingCreatedEmail({
      userId: normalized.userId,
      bookingId: normalized.id,
      tourTitle: normalized.tourTitle,
      contactEmail: normalized.contactEmail,
      contactName: normalized.contactName,
      guests: normalized.guests,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
    });
    if (normalized.fillTravelersLater) {
      notifyTravelersFormDue(normalized);
    }
    return normalized;
  }
  writeAllBookings([normalized, ...all]);
  notifyUpdated();
  notifyBookingCreated(normalized);
  void notifyBookingCreatedEmail({
    userId: normalized.userId,
    bookingId: normalized.id,
    tourTitle: normalized.tourTitle,
    contactEmail: normalized.contactEmail,
    contactName: normalized.contactName,
    guests: normalized.guests,
    startDate: normalized.startDate,
    endDate: normalized.endDate,
  });
  if (normalized.fillTravelersLater) {
    notifyTravelersFormDue(normalized);
  }
  return normalized;
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

export function createBookingFromCheckoutLocal(input: {
  actor: SessionUser | null;
  userId?: string;
  tour: TourDetail;
  guests: number;
  startDate?: string;
  endDate?: string;
  totalPriceUsd: number;
  form: CheckoutFormState;
  priceQuoteRequest?: boolean;
  persist?: boolean;
  checkoutCurrency?: CheckoutCurrencyCode;
  checkoutRates?: Partial<Record<CurrencyCode, number>>;
  checkoutRatesUpdatedAt?: string;
  checkoutRatesSource?: "frankfurter" | "fallback";
  payNowUsd?: number;
  attribution?: BookingAttribution;
}): Booking | { error: string } {
  const contactEmail = input.form.contactEmail.trim();
  const userId =
    input.userId ??
    input.actor?.id ??
    (contactEmail ? guestUserIdFromEmail(contactEmail) : "");

  if (!userId) {
    return { error: "Укажите email для отправки заявки" };
  }

  const fillTravelersLater = input.form.fillTravelersLater;
  const travelers = travelersFromCheckoutForm(input.form);
  const now = new Date().toISOString();
  const paymentOption = input.priceQuoteRequest ? "later" : input.form.paymentOption;
  const organizerParams = normalizeOrganizerParams(undefined);
  const paymentStatus: BookingPaymentStatus =
    paymentOption === "later" ? "pending" : paymentOption === "deposit" ? "partial" : "pending";
  const paymentSummary = buildPaymentSummaryFromStatus(
    input.totalPriceUsd,
    paymentStatus,
    organizerParams
  );

  if (paymentOption === "deposit") {
    paymentSummary.paidAmountUsd = 0;
    paymentSummary.remainingAmountUsd = input.totalPriceUsd;
  }

  const payNowUsd =
    input.payNowUsd ??
    (paymentOption === "deposit"
      ? computePrepaymentAmount(input.totalPriceUsd, organizerParams)
      : paymentOption === "later"
        ? 0
        : input.totalPriceUsd);

  const checkoutCurrency = input.checkoutCurrency ?? "USD";
  const checkoutDisplay = buildCheckoutDisplaySnapshot({
    currency: checkoutCurrency,
    totalUsd: input.totalPriceUsd,
    payNowUsd,
    rates: input.checkoutRates,
    ratesUpdatedAt: input.checkoutRatesUpdatedAt,
    ratesSource: input.checkoutRatesSource,
  });

  const bookingResult = createBooking({
    actor: input.actor,
    userId,
    tour: input.tour,
    guests: input.guests,
    startDate: input.startDate,
    endDate: input.endDate,
    totalPriceUsd: input.totalPriceUsd,
    priceQuoteRequest: input.priceQuoteRequest,
    contactName: [input.form.contactFirstName, input.form.contactLastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" "),
    contactEmail,
    contactPhone: input.form.contactPhone.trim(),
    touristComment: input.form.comments,
    status: "new",
    organizerTourId: resolveOrganizerTourId(input.tour.slug),
    fillTravelersLater,
    travelers,
    travelersCompletedAt: travelers?.length ? now : undefined,
    checkoutPaymentOption: paymentOption,
    allowGuestRequest: !input.actor,
    persist: input.persist,
  });

  if ("error" in bookingResult) return bookingResult;

  const payToken = createId("pay");
  const paymentLink =
    paymentOption === "later"
      ? createBookingPaymentLinkRecord({
          token: payToken,
          booking: { ...bookingResult, paymentStatus, paymentSummary },
          now,
        })
      : undefined;

  const updated: Booking = syncPaymentDenormalizedFields({
    ...bookingResult,
    paymentStatus,
    paymentSummary,
    paymentLink,
    attribution: input.attribution,
    metadata: {
      checkoutCurrency,
      checkoutDisplay,
    },
    invoices:
      paymentOption === "later"
        ? [
            buildFullPaymentInvoice({
              ...bookingResult,
              totalPriceUsd: input.totalPriceUsd,
            }),
          ]
        : [
            buildPrepaymentInvoice(
              { ...bookingResult, totalPriceUsd: input.totalPriceUsd },
              organizerParams
            ),
          ],
    updatedAt: now,
  });

  if (input.persist === false) {
    if (paymentLink) {
      notifyPaymentReminder(updated, paymentLink.token);
    }
    return updated;
  }

  const all = getAllBookings();
  const index = all.findIndex((item) => item.id === bookingResult.id);
  if (index === -1) return updated;

  persistBookingUpdate(index, updated);

  if (paymentLink) {
    notifyPaymentReminder(updated, paymentLink.token);
  }

  return updated;
}

export async function createBookingFromCheckout(input: {
  actor: SessionUser | null;
  userId?: string;
  tour: TourDetail;
  guests: number;
  startDate?: string;
  endDate?: string;
  totalPriceUsd: number;
  form: CheckoutFormState;
  priceQuoteRequest?: boolean;
  checkoutCurrency?: CheckoutCurrencyCode;
  checkoutRates?: Partial<Record<CurrencyCode, number>>;
  checkoutRatesUpdatedAt?: string;
  checkoutRatesSource?: "frankfurter" | "fallback";
  payNowUsd?: number;
  attribution?: BookingAttribution;
}): Promise<Booking | { error: string }> {
  if (!isRemoteBookingsMode()) {
    return createBookingFromCheckoutLocal(input);
  }

  const built = createBookingFromCheckoutLocal({ ...input, persist: false });
  if ("error" in built) return built;

  try {
    const saved = await apiCreateBooking(built);
    notifyUpdated();
    return saved;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Не удалось сохранить заявку",
    };
  }
}

/** @deprecated Use createBookingFromCheckout — kept for sync local callers */
export function createBookingFromCheckoutSync(input: {
  actor: SessionUser | null;
  userId?: string;
  tour: TourDetail;
  guests: number;
  startDate?: string;
  endDate?: string;
  totalPriceUsd: number;
  form: CheckoutFormState;
}): Booking | { error: string } {
  return createBookingFromCheckoutLocal(input);
}

export function getBookingByTravelersToken(token: string): Booking | undefined {
  const booking = getAllBookings().find((item) => item.travelersFormToken === token);
  return booking ? normalizeBooking(booking) : undefined;
}

export function submitBookingTravelers(input: {
  token: string;
  travelers: BookingTraveler[];
}): { booking: Booking } | { error: string } {
  const all = getAllBookings();
  const index = all.findIndex((booking) => booking.travelersFormToken === input.token);
  if (index === -1) return { error: "Ссылка недействительна или заявка не найдена" };

  const current = normalizeBooking(all[index]);
  const travelers = ensureTravelersSlotCount(
    normalizeTravelers(input.travelers),
    current.guests
  );

  const incomplete = travelers.find(
    (traveler) => !traveler.fullName.trim() || !traveler.dateOfBirth.trim()
  );
  if (incomplete) {
    return { error: "Заполните ФИО и дату рождения для всех участников" };
  }

  const now = new Date().toISOString();
  const updated: Booking = {
    ...current,
    travelers,
    fillTravelersLater: false,
    travelersCompletedAt: now,
    updatedAt: now,
  };

  if (!hasCompleteBookingTravelers(updated)) {
    return { error: "Не удалось сохранить данные участников" };
  }

  persistBookingUpdate(index, updated);
  return { booking: updated };
}

function buildFullPaymentInvoice(booking: Booking): BookingInvoice {
  const paidAmountUsd = booking.paymentSummary?.paidAmountUsd ?? 0;

  return {
    id: `inv-full-${booking.id}`,
    type: "full",
    number: formatBookingDisplayNumber(booking.id),
    createdAt: booking.createdAt,
    amountUsd: booking.totalPriceUsd,
    paidAmountUsd: Math.min(paidAmountUsd, booking.totalPriceUsd),
    status: paidAmountUsd >= booking.totalPriceUsd ? "paid" : "pending",
    paymentChannel: "platform",
    title: "Счёт на полную оплату",
  };
}

function buildPrepaymentInvoice(
  booking: Booking,
  params: BookingOrganizerParams
): BookingInvoice {
  const prepaymentAmount = computePrepaymentAmount(booking.totalPriceUsd, params);
  const paidAmountUsd = booking.paymentSummary?.paidAmountUsd ?? 0;

  return {
    id: `inv-prepay-${booking.id}`,
    type: "prepayment",
    number: formatBookingDisplayNumber(booking.id),
    createdAt: booking.createdAt,
    amountUsd: prepaymentAmount,
    paidAmountUsd: Math.min(paidAmountUsd, prepaymentAmount),
    status: paidAmountUsd >= prepaymentAmount ? "paid" : paidAmountUsd > 0 ? "partial" : "pending",
    paymentChannel: "platform",
  };
}

export function updateOrganizerBookingDetails(input: {
  bookingId: string;
  actor: SessionUser | null;
  contactName: string;
  guests: number;
  paymentStatus: BookingPaymentStatus;
  organizerTourId?: string;
  tourId: string;
  tourSlug: string;
  tourTitle: string;
  tourImage: string;
  startDate?: string;
  endDate?: string;
  totalPriceUsd: number;
  organizerParams: BookingOrganizerParams;
}): { booking: Booking } | { error: string } {
  const contactName = input.contactName.trim();
  if (!contactName) return { error: "Укажите ФИО заказчика" };

  const guests = Math.max(1, Math.round(input.guests));
  const totalPriceUsd = Math.max(0, Math.round(input.totalPriceUsd));
  const organizerParams = normalizeOrganizerParams({
    ...input.organizerParams,
    pricePerGuestUsd:
      guests > 0
        ? Math.round(totalPriceUsd / guests)
        : input.organizerParams.pricePerGuestUsd,
  });

  const all = getAllBookings();
  const index = all.findIndex((booking) => booking.id === input.bookingId);
  if (index === -1) return { error: "Бронирование не найдено" };

  const current = normalizeBooking(all[index]);
  const tourOwnerUserId = current.organizerTourId
    ? getOrganizerTourOwnerId(current.organizerTourId)
    : undefined;

  const allowed = assertPermission(
    canManageBooking(input.actor, {
      tourOwnerUserId: input.organizerTourId
        ? getOrganizerTourOwnerId(input.organizerTourId)
        : tourOwnerUserId,
    })
  );
  if ("error" in allowed) return { error: allowed.error };

  const travelers = ensureTravelersSlotCount(normalizeTravelers(current.travelers), guests);
  const travelersComplete = travelers
    .slice(0, guests)
    .every((traveler) => traveler.fullName.trim() && traveler.dateOfBirth.trim());

  const now = new Date().toISOString();
  const paymentSummary = buildPaymentSummaryFromStatus(
    totalPriceUsd,
    input.paymentStatus,
    organizerParams
  );

  const draftBooking: Booking = {
    ...current,
    contactName,
    guests,
    organizerTourId: input.organizerTourId || current.organizerTourId,
    tourId: input.tourId,
    tourSlug: input.tourSlug,
    tourTitle: input.tourTitle,
    tourImage: input.tourImage,
    startDate: input.startDate?.trim() || undefined,
    endDate: input.endDate?.trim() || undefined,
    totalPriceUsd,
    organizerParams,
    paymentStatus: input.paymentStatus,
    paymentSummary,
    invoices: syncInvoicesAfterPayment({
      ...current,
      totalPriceUsd,
      paymentStatus: input.paymentStatus,
      paymentSummary,
    }),
    paymentLink:
      input.paymentStatus === "paid" && current.paymentLink?.status === "active"
        ? {
            ...current.paymentLink,
            status: "paid",
            paidAt: now,
          }
        : current.paymentLink,
    travelers,
    travelersCompletedAt: travelersComplete ? current.travelersCompletedAt ?? now : undefined,
    fillTravelersLater: travelersComplete ? false : current.fillTravelersLater,
    updatedAt: now,
  };

  persistBookingUpdate(index, draftBooking);

  const previousStatus = resolveBookingPaymentStatus(current);
  if (input.paymentStatus !== previousStatus) {
    if (input.paymentStatus === "paid" || input.paymentStatus === "partial") {
      notifyPaymentStatusChanged(
        draftBooking,
        input.paymentStatus === "paid" ? "paid" : "partial"
      );
      void notifyPaymentReceivedEmail({
        userId: draftBooking.userId,
        bookingId: draftBooking.id,
        tourTitle: draftBooking.tourTitle,
        contactEmail: draftBooking.contactEmail,
        contactName: draftBooking.contactName,
        amountUsd: draftBooking.paymentSummary?.paidAmountUsd,
        paymentStatus: input.paymentStatus === "paid" ? "paid" : "partial",
      });
    } else if (input.paymentStatus === "refunded") {
      notifyPaymentStatusChanged(draftBooking, "refunded");
      void notifyPaymentReceivedEmail({
        userId: draftBooking.userId,
        bookingId: draftBooking.id,
        tourTitle: draftBooking.tourTitle,
        contactEmail: draftBooking.contactEmail,
        contactName: draftBooking.contactName,
        amountUsd: draftBooking.paymentSummary?.paidAmountUsd,
        paymentStatus: "refunded",
      });
    }
  }

  return { booking: draftBooking };
}

export function getBookingByPaymentLinkToken(token: string): Booking | undefined {
  const booking = getAllBookings().find((item) => item.paymentLink?.token === token);
  return booking ? normalizeBooking(booking) : undefined;
}

function syncInvoicesAfterPayment(booking: Booking): BookingInvoice[] {
  const paidAmountUsd = booking.paymentSummary?.paidAmountUsd ?? 0;
  const invoices = booking.invoices?.length
    ? booking.invoices
    : resolveBookingInvoices(booking);

  return invoices.map((invoice) => {
    const invoicePaid = Math.min(paidAmountUsd, invoice.amountUsd);
    const status =
      invoicePaid >= invoice.amountUsd ? "paid" : invoicePaid > 0 ? "partial" : invoice.status;

    return {
      ...invoice,
      paidAmountUsd: invoicePaid,
      status,
    };
  });
}

export function generateOrganizerBookingPaymentLink(input: {
  bookingId: string;
  actor: SessionUser | null;
  target?: BookingPaymentLinkTarget;
}): { booking: Booking; paymentLinkUrl: string } | { error: string } {
  const all = getAllBookings();
  const index = all.findIndex((booking) => booking.id === input.bookingId);
  if (index === -1) return { error: "Бронирование не найдено" };

  const current = normalizeBooking(all[index]);
  const tourOwnerUserId = current.organizerTourId
    ? getOrganizerTourOwnerId(current.organizerTourId)
    : undefined;

  const allowed = assertPermission(
    canManageBooking(input.actor, {
      tourOwnerUserId,
    })
  );
  if ("error" in allowed) return { error: allowed.error };

  const now = new Date().toISOString();
  const token = createId("pay");
  const paymentLink = createBookingPaymentLinkRecord({
    token,
    booking: current,
    target: input.target,
    now,
  });

  const updated: Booking = {
    ...current,
    paymentLink,
    updatedAt: now,
  };

  persistBookingUpdate(index, updated);
  notifyPaymentReminder(updated, token);

  return {
    booking: updated,
    paymentLinkUrl: buildBookingPaymentLinkUrl(token),
  };
}

export function markBookingPaymentLinkOpened(token: string): { booking: Booking } | { error: string } {
  const all = getAllBookings();
  const index = all.findIndex((booking) => booking.paymentLink?.token === token);
  if (index === -1) return { error: "Ссылка недействительна" };

  const current = normalizeBooking(all[index]);
  const link = current.paymentLink;
  if (!link) return { error: "Ссылка недействительна" };
  if (link.status === "paid" || link.status === "cancelled") {
    return { booking: current };
  }
  if (isBookingPaymentLinkExpired(link)) {
    const updated: Booking = {
      ...current,
      paymentLink: { ...link, status: "expired" },
      updatedAt: new Date().toISOString(),
    };
    persistBookingUpdate(index, updated);
    return { booking: updated };
  }

  if (link.openedAt) return { booking: current };

  const now = new Date().toISOString();
  const updated: Booking = {
    ...current,
    paymentLink: { ...link, openedAt: now },
    updatedAt: now,
  };
  persistBookingUpdate(index, updated);
  return { booking: updated };
}

/** Webhook-ready handler: marks booking paid after successful payment by link token. */
export function completeBookingPaymentFromLink(input: {
  token: string;
}): { booking: Booking } | { error: string } {
  const all = getAllBookings();
  const index = all.findIndex((booking) => booking.paymentLink?.token === input.token);
  if (index === -1) return { error: "Ссылка недействительна" };

  const current = normalizeBooking(all[index]);
  const link = current.paymentLink;
  if (!link) return { error: "Ссылка недействительна" };
  if (link.status === "paid") return { booking: current };
  if (link.status === "cancelled") return { error: "Ссылка отменена" };
  if (isBookingPaymentLinkExpired(link)) return { error: "Ссылка истекла" };

  const now = new Date().toISOString();
  const organizerParams = resolveOrganizerParams(current);
  const previousPaid = current.paymentSummary?.paidAmountUsd ?? 0;
  const nextPaid = Math.min(current.totalPriceUsd, previousPaid + link.amountUsd);
  const paymentStatus: BookingPaymentStatus =
    nextPaid >= current.totalPriceUsd
      ? "paid"
      : nextPaid > 0
        ? "partial"
        : "pending";

  const paymentSummary = buildPaymentSummaryFromStatus(
    current.totalPriceUsd,
    paymentStatus,
    organizerParams
  );
  paymentSummary.paidAmountUsd = nextPaid;
  paymentSummary.remainingAmountUsd = Math.max(0, current.totalPriceUsd - nextPaid);

  const draft: Booking = {
    ...current,
    paymentStatus,
    paymentSummary,
    paymentLink: {
      ...link,
      status: "paid",
      paidAt: now,
    },
    invoices: syncInvoicesAfterPayment({
      ...current,
      paymentStatus,
      paymentSummary,
    }),
    updatedAt: now,
  };

  persistBookingUpdate(index, draft);
  notifyPaymentStatusChanged(
    draft,
    paymentStatus === "paid" ? "paid" : paymentStatus === "partial" ? "partial" : "partial"
  );
  if (paymentStatus === "paid" || paymentStatus === "partial") {
    void notifyPaymentReceivedEmail({
      userId: draft.userId,
      bookingId: draft.id,
      tourTitle: draft.tourTitle,
      contactEmail: draft.contactEmail,
      contactName: draft.contactName,
      amountUsd: draft.paymentSummary?.paidAmountUsd,
      paymentStatus: paymentStatus === "paid" ? "paid" : "partial",
    });
  }
  return { booking: draft };
}

/** Pay-later acknowledgment — no charge, records intent for organizer follow-up. */
export function acknowledgeBookingPaymentIntent(
  token: string
): { booking: Booking } | { error: string } {
  const all = getAllBookings();
  const index = all.findIndex((booking) => booking.paymentLink?.token === token);
  if (index === -1) return { error: "Ссылка недействительна" };

  const current = normalizeBooking(all[index]);
  const link = current.paymentLink;
  if (!link) return { error: "Ссылка недействительна" };
  if (link.status === "paid") return { booking: current };
  if (link.status === "cancelled") return { error: "Ссылка отменена" };
  if (isBookingPaymentLinkExpired(link)) return { error: "Ссылка истекла" };

  notifyPayLaterAcknowledged(current);
  return { booking: current };
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

export function getBookingByClientPortalToken(token: string): Booking | undefined {
  const booking = getAllBookings().find((item) => item.clientPortalToken === token);
  return booking ? normalizeBooking(booking) : undefined;
}

export function createExternalOrganizerBooking(input: {
  actor: SessionUser | null;
  organizerTourId?: string;
  tourId?: string;
  tourSlug: string;
  tourTitle: string;
  tourImage: string;
  bookingSource: BookingSource;
  externalReference?: string;
  guests: number;
  startDate?: string;
  endDate?: string;
  totalPriceUsd?: number;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  touristComment?: string;
  status?: BookingStatus;
}): Booking | { error: string } {
  if (!input.actor) return { error: "Требуется авторизация организатора" };

  const contactEmail = normalizeContactEmail(input.contactEmail);
  if (!contactEmail) return { error: "Укажите email клиента" };
  if (!input.contactName.trim()) return { error: "Укажите имя клиента" };
  if (input.guests < 1) return { error: "Укажите число гостей" };

  const now = new Date().toISOString();
  const id = createId("booking");
  const status = input.status ?? "confirmed";
  const tripOperations: TripOperations = {
    tasks: buildDefaultTripTasks(input.tourSlug),
    resourceLinks: [],
    updatedAt: now,
  };

  const booking: Booking = normalizeBooking({
    id,
    userId: guestUserIdFromEmail(contactEmail),
    organizerTourId: input.organizerTourId ?? resolveOrganizerTourId(input.tourSlug),
    tourId: input.tourId ?? "external",
    tourSlug: input.tourSlug,
    tourTitle: input.tourTitle.trim(),
    tourImage: input.tourImage,
    status,
    guests: input.guests,
    startDate: input.startDate?.trim() || undefined,
    endDate: input.endDate?.trim() || undefined,
    totalPriceUsd: input.totalPriceUsd ?? 0,
    contactName: input.contactName.trim(),
    contactEmail,
    contactPhone: input.contactPhone?.trim() || "",
    touristComment: input.touristComment?.trim() || undefined,
    organizerComments: [],
    statusHistory: [
      createStatusChange({
        from: null,
        to: status,
        changedBy: "organizer",
        note: `Внешнее бронирование (${input.bookingSource})`,
      }),
    ],
    createdAt: now,
    updatedAt: now,
    bookingSource: input.bookingSource,
    externalReference: input.externalReference?.trim() || undefined,
    clientPortalToken: resolveClientPortalToken({ id }),
    fillTravelersLater: true,
    travelersFormToken: resolveTravelersFormToken({ id }),
    tripOperations,
  });

  const all = getAllBookings();
  all.unshift(booking);
  writeAllBookings(all);
  notifyUpdated();
  return booking;
}

export function updateTripOperations(input: {
  bookingId: string;
  actor: SessionUser | null;
  tripOperations: TripOperations;
}): { booking: Booking } | { error: string } {
  const all = getAllBookings();
  const index = all.findIndex((item) => item.id === input.bookingId);
  if (index === -1) return { error: "Заявка не найдена" };

  const current = normalizeBooking(all[index]);
  const tourOwnerUserId = current.organizerTourId
    ? getOrganizerTourOwnerId(current.organizerTourId)
    : undefined;

  const allowed = assertPermission(
    canManageBooking(input.actor, { tourOwnerUserId })
  );
  if ("error" in allowed) return { error: allowed.error };

  const now = new Date().toISOString();
  const normalizedNext = normalizeTripOperations(input.tripOperations)!;
  const mergedOps = mergeTripOperationsWithClientUpdates({
    previous: current.tripOperations,
    next: normalizedNext,
  });
  const updated: Booking = normalizeBooking({
    ...current,
    tripOperations: {
      ...mergedOps,
      updatedAt: now,
    },
    updatedAt: now,
  });

  persistBookingUpdate(index, updated);
  return { booking: updated };
}

export function initTripOperationsForBooking(input: {
  bookingId: string;
  actor: SessionUser | null;
}): { booking: Booking } | { error: string } {
  const all = getAllBookings();
  const index = all.findIndex((item) => item.id === input.bookingId);
  if (index === -1) return { error: "Заявка не найдена" };

  const current = normalizeBooking(all[index]);
  if (current.tripOperations?.tasks.length) {
    return { booking: current };
  }

  return updateTripOperations({
    bookingId: input.bookingId,
    actor: input.actor,
    tripOperations: ensureTripOperations(undefined, current.tourSlug),
  });
}

export function submitTripClientRequirements(input: {
  token: string;
  requirements: TripClientRequirements;
}): { booking: Booking } | { error: string } {
  const all = getAllBookings();
  const index = all.findIndex((booking) => booking.clientPortalToken === input.token);
  if (index === -1) return { error: "Ссылка недействительна или поездка не найдена" };

  const current = normalizeBooking(all[index]);
  const now = new Date().toISOString();
  const requirements: TripClientRequirements = {
    flightArrival: input.requirements.flightArrival?.trim() || undefined,
    flightDeparture: input.requirements.flightDeparture?.trim() || undefined,
    hotelName: input.requirements.hotelName?.trim() || undefined,
    hotelAddress: input.requirements.hotelAddress?.trim() || undefined,
    hotelCheckIn: input.requirements.hotelCheckIn?.trim() || undefined,
    hotelCheckOut: input.requirements.hotelCheckOut?.trim() || undefined,
    dietaryRestrictions: input.requirements.dietaryRestrictions?.trim() || undefined,
    mobilityNotes: input.requirements.mobilityNotes?.trim() || undefined,
    specialRequests: input.requirements.specialRequests?.trim() || undefined,
    submittedAt: now,
  };

  const tripOperations = ensureTripOperations(current.tripOperations, current.tourSlug);
  const isUpdate = Boolean(current.tripOperations?.clientRequirements?.submittedAt);
  const organizerComment = {
    id: createId("comment"),
    text: isUpdate
      ? "Клиент обновил анкету потребностей в портале поездки."
      : "Клиент заполнил анкету потребностей в портале поездки.",
    authorName: "Система",
    createdAt: now,
  };

  const updated: Booking = normalizeBooking({
    ...current,
    tripOperations: {
      ...tripOperations,
      clientRequirements: requirements,
      updatedAt: now,
    },
    organizerComments: [organizerComment, ...current.organizerComments],
    updatedAt: now,
  });

  persistBookingUpdate(index, updated);
  return { booking: updated };
}
