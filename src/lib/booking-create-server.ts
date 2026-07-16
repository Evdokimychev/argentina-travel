import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Booking, BookingTraveler } from "@/types/tourist";
import type { CreateBookingCommand } from "@/lib/booking-create-command";
import { totalCommandTravelers } from "@/lib/booking-create-command";
import { calculateCanonicalBookingPrice } from "@/lib/booking-create-pricing";
import type { BookingPriceSnapshot } from "@/lib/booking-create-pricing";
import { resolveTourCheckoutRoomOptions } from "@/lib/tour-checkout-accommodation";
import { fetchPublishedTourBookingSourceByIdServer } from "@/lib/tour-content-server";
import { getAllCanonicalTours } from "@/lib/tour-repository";
import { tourToDetail } from "@/lib/tour-mapper";
import { resolveTourOwnerUserId } from "@/lib/organizer-public";
import { guestUserIdFromEmail } from "@/lib/guest-booking";
import { buildPaymentSummaryFromStatus, normalizeOrganizerParams } from "@/lib/booking-params";

type DbClient = SupabaseClient<Database>;

export class BookingCommandError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "BookingCommandError";
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function positiveInt(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function allocationMap(value: unknown): Record<string, number> | undefined {
  const source = record(value);
  if (!source) return undefined;
  return Object.fromEntries(
    Object.entries(source).map(([key, count]) => [cleanText(key, 80), positiveInt(count)])
  );
}

export function parseCreateBookingCommand(value: unknown): CreateBookingCommand {
  const source = record(value);
  const travelers = record(source?.travelers);
  const customer = record(source?.customer);
  const selections = record(source?.selections);
  const details = record(source?.details);
  if (!source || !travelers || !customer) {
    throw new BookingCommandError("Некорректные данные заявки.");
  }

  const command: CreateBookingCommand = {
    tourId: cleanText(source.tourId, 160),
    optionId: cleanText(source.optionId, 160) || undefined,
    startDate: cleanText(source.startDate, 10),
    travelers: {
      adults: positiveInt(travelers.adults),
      children: positiveInt(travelers.children) || undefined,
    },
    customer: {
      name: cleanText(customer.name, 160),
      email: cleanText(customer.email, 254).toLowerCase(),
      phone: cleanText(customer.phone, 60) || undefined,
    },
    promoCode: cleanText(source.promoCode, 80) || undefined,
    idempotencyKey: cleanText(source.idempotencyKey, 200),
    intent: source.intent === "price_quote" ? "price_quote" : "booking",
    selections: selections
      ? {
          roomAllocations: allocationMap(selections.roomAllocations),
          addonIds: Array.isArray(selections.addonIds)
            ? selections.addonIds.map((id) => cleanText(id, 80)).filter(Boolean).slice(0, 20)
            : undefined,
          transferAllocations: allocationMap(selections.transferAllocations),
        }
      : undefined,
    details: details
      ? {
          comment: cleanText(details.comment, 2000) || undefined,
          fillTravelersLater: Boolean(details.fillTravelersLater),
          displayCurrency:
            details.displayCurrency === "ARS" || details.displayCurrency === "EUR"
              ? details.displayCurrency
              : "USD",
          travelers: Array.isArray(details.travelers)
            ? details.travelers.slice(0, 50).map((item) => {
                const traveler = record(item);
                return {
                  firstName: cleanText(traveler?.firstName, 80),
                  lastName: cleanText(traveler?.lastName, 80),
                  dateOfBirth: cleanText(traveler?.dateOfBirth, 10) || undefined,
                };
              })
            : undefined,
        }
      : undefined,
  };

  if (!command.tourId || !/^\d{4}-\d{2}-\d{2}$/.test(command.startDate)) {
    throw new BookingCommandError("Выберите тур и дату поездки.");
  }
  if (!command.customer.name || !/^\S+@\S+\.\S+$/.test(command.customer.email)) {
    throw new BookingCommandError("Проверьте имя и email для связи.");
  }
  if (totalCommandTravelers(command) < 1) {
    throw new BookingCommandError("Укажите количество туристов.");
  }
  if (command.idempotencyKey.length < 16) {
    throw new BookingCommandError("Не удалось защитить заявку от повтора. Обновите страницу.");
  }
  if (command.promoCode) {
    throw new BookingCommandError("Этот промокод пока нельзя применить. Уберите его и повторите.");
  }
  return command;
}

function toBookingTravelers(command: CreateBookingCommand): BookingTraveler[] | undefined {
  if (command.details?.fillTravelersLater) return undefined;
  const travelers = command.details?.travelers
    ?.map((item, index) => ({
      id: `guest-${index + 1}`,
      fullName: [item.firstName, item.lastName].filter(Boolean).join(" "),
      dateOfBirth: item.dateOfBirth ?? "",
    }))
    .filter((item) => item.fullName && /^\d{4}-\d{2}-\d{2}$/.test(item.dateOfBirth));
  return travelers?.length ? travelers : undefined;
}

function fingerprint(command: CreateBookingCommand): string {
  return createHash("sha256").update(JSON.stringify(command)).digest("hex");
}

export async function buildCanonicalBooking(
  supabase: DbClient,
  command: CreateBookingCommand,
  authUserId?: string | null
): Promise<{ booking: Booking; organizerUserId: string; requestFingerprint: string }> {
  const databaseSource = await fetchPublishedTourBookingSourceByIdServer(command.tourId);
  const canonicalTour = databaseSource
    ? null
    : getAllCanonicalTours().find(
        (candidate) =>
          candidate.id === command.tourId &&
          candidate.status === "published" &&
          !candidate.isPrivate
      );
  const source = databaseSource ?? (canonicalTour
    ? { tour: tourToDetail(canonicalTour), ownerUserId: resolveTourOwnerUserId(canonicalTour) }
    : null);
  if (!source) throw new BookingCommandError("Тур не найден или снят с публикации.", 404);
  const { tour, ownerUserId } = source;
  if (tour.partnerSource || tour.customBookingLink) {
    throw new BookingCommandError("Этот тур оформляется на сайте партнёра.", 409);
  }

  const guests = totalCommandTravelers(command);
  if (guests < tour.groupMin || guests > tour.groupMax) {
    throw new BookingCommandError(`Для этого тура доступна группа от ${tour.groupMin} до ${tour.groupMax} человек.`);
  }
  const today = new Date().toISOString().slice(0, 10);
  if (command.startDate < today) {
    throw new BookingCommandError("Дата поездки уже прошла. Выберите новую дату.");
  }

  const selectedDate = tour.dates.find(
    (date) =>
      (command.optionId ? date.id === command.optionId : date.startDate === command.startDate) &&
      date.startDate === command.startDate
  );
  const scheduledOnly = (tour.bookingMode ?? "scheduled") === "scheduled";
  if (!selectedDate && scheduledOnly) {
    throw new BookingCommandError("Выбранная дата больше недоступна.", 409);
  }
  if (selectedDate && selectedDate.spotsLeft < guests) {
    throw new BookingCommandError(`На выбранную дату осталось мест: ${selectedDate.spotsLeft}.`, 409);
  }
  if (!selectedDate && tour.requestDateFrom && command.startDate < tour.requestDateFrom) {
    throw new BookingCommandError("Дата находится вне доступного периода.");
  }
  if (!selectedDate && tour.requestDateTo && command.startDate > tour.requestDateTo) {
    throw new BookingCommandError("Дата находится вне доступного периода.");
  }

  const now = new Date().toISOString();
  const requestFingerprint = fingerprint(command);
  const keyHash = createHash("sha256").update(command.idempotencyKey).digest("hex");
  const bookingId = `booking-${keyHash.slice(0, 24)}`;
  let priceSnapshot: BookingPriceSnapshot | undefined;
  try {
    priceSnapshot =
      command.intent === "price_quote"
        ? undefined
        : calculateCanonicalBookingPrice({
            basePricePerTravelerUsd: selectedDate?.priceUsd || tour.priceUsd,
            travelers: guests,
            groupDiscount: tour.groupDiscount,
            roomOptions: resolveTourCheckoutRoomOptions(tour),
            selections: command.selections,
            calculatedAt: now,
          });
  } catch (error) {
    throw new BookingCommandError(
      error instanceof Error ? error.message : "Не удалось рассчитать стоимость заявки."
    );
  }
  const totalPriceUsd = priceSnapshot?.totalUsd ?? 0;
  const organizerParams = normalizeOrganizerParams({
    currency: "USD",
    pricePerGuestUsd: guests > 0 ? totalPriceUsd / guests : totalPriceUsd,
  });
  const travelers = toBookingTravelers(command);
  const paymentSummary = buildPaymentSummaryFromStatus(totalPriceUsd, "pending", organizerParams);
  const booking: Booking = {
    id: bookingId,
    userId: authUserId ?? guestUserIdFromEmail(command.customer.email),
    organizerTourId: tour.id,
    tourId: tour.id,
    tourSlug: tour.slug,
    tourTitle: tour.title,
    tourImage: tour.image,
    status: "new",
    guests,
    startDate: command.startDate,
    endDate: selectedDate?.endDate,
    totalPriceUsd,
    priceQuoteRequest: command.intent === "price_quote",
    contactName: command.customer.name,
    contactEmail: command.customer.email,
    contactPhone: command.customer.phone ?? "",
    touristComment: command.details?.comment,
    organizerComments: [],
    statusHistory: [{
      id: `status-${keyHash.slice(0, 12)}`,
      from: null,
      to: "new",
      changedAt: now,
      changedBy: "system",
    }],
    fillTravelersLater: command.details?.fillTravelersLater ?? false,
    travelers,
    travelersFormToken: `travelers-${keyHash.slice(0, 32)}`,
    travelersCompletedAt: travelers?.length ? now : undefined,
    paymentStatus: "pending",
    organizerParams,
    checkoutPaymentOption: "later",
    paymentSummary,
    metadata: {
      checkoutCurrency: command.details?.displayCurrency ?? "USD",
      priceSnapshot,
      idempotencyKeyHash: keyHash,
      requestFingerprint,
    },
    createdAt: now,
    updatedAt: now,
  };
  booking.amountDue = paymentSummary.remainingAmountUsd;
  booking.amountPaid = paymentSummary.paidAmountUsd;

  return { booking, organizerUserId: ownerUserId, requestFingerprint };
}
