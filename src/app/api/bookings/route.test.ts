import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateBookingCommand } from "@/lib/booking-create-command";
import type { Booking } from "@/types/tourist";

const mocks = vi.hoisted(() => ({
  enabled: true,
  authUser: { id: "auth-user", email: "ivan@example.com" } as { id: string; email?: string } | null,
  admin: { kind: "fake-admin" },
  stored: new Map<string, { booking: Booking; fingerprint: string }>(),
  reservations: 0,
  verifyProtection: vi.fn(),
  buildCanonical: vi.fn(),
  ensureAvailability: vi.fn(),
  attachGuest: vi.fn(),
  insertAtomic: vi.fn(),
  notifyCreated: vi.fn(),
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  fetchNavigation: vi.fn(),
}));

vi.mock("@/lib/auth-mode", () => ({
  isSupabaseBookingsEnabled: () => mocks.enabled,
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    kind: "fake-server",
    auth: { getUser: async () => ({ data: { user: mocks.authUser } }) },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => mocks.admin,
}));
vi.mock("@/lib/supabase-auth-provider", () => ({
  loadSessionUserFromSupabase: vi.fn(),
}));
vi.mock("@/lib/forms/captcha-server", () => ({
  verifyGuestFormProtection: mocks.verifyProtection,
}));
vi.mock("@/lib/site-settings-server", () => ({
  fetchSiteNavigation: mocks.fetchNavigation,
}));
vi.mock("@/lib/tour-availability-server", () => ({
  ensureAvailabilitySlotForBooking: mocks.ensureAvailability,
}));
vi.mock("@/lib/bookings-server", () => ({
  attachGuestBookingsToCurrentUser: mocks.attachGuest,
  insertCanonicalBookingAtomically: mocks.insertAtomic,
}));
vi.mock("@/lib/bookings-notify", () => ({
  notifyBookingCreatedEmail: mocks.notifyCreated,
}));
vi.mock("@/lib/monitoring/sentry", () => ({
  addBookingBreadcrumb: mocks.addBreadcrumb,
  captureException: mocks.captureException,
}));
vi.mock("@/lib/booking-create-server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/booking-create-server")>();
  return { ...actual, buildCanonicalBooking: mocks.buildCanonical };
});

import { POST } from "@/app/api/bookings/route";

let requestSequence = 0;

const baseCommand: CreateBookingCommand = {
  tourId: "tour-1",
  optionId: "date-1",
  startDate: "2026-12-20",
  travelers: { adults: 2 },
  customer: {
    name: "Иван Иванов",
    email: "ivan@example.com",
    phone: "+5491112345678",
  },
  idempotencyKey: "01234567-89ab-cdef-0123-456789abcdef",
  intent: "booking",
};

function request(command: unknown = baseCommand, ip?: string): Request {
  requestSequence += 1;
  return new Request("https://www.goargentina.ru/api/bookings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip ?? `198.51.100.${requestSequence}`,
    },
    body: JSON.stringify({ command, captchaToken: "captcha-ok", company: "" }),
  });
}

function canonicalBooking(command: CreateBookingCommand, authUserId?: string | null): Booking {
  const fingerprint = JSON.stringify({
    tourId: command.tourId,
    startDate: command.startDate,
    travelers: command.travelers,
    customer: command.customer,
    intent: command.intent,
  });
  const idSuffix = command.idempotencyKey.replace(/[^a-z0-9]/gi, "").slice(0, 24);
  return {
    id: `booking-${idSuffix}`,
    userId: authUserId ?? "guest-derived-on-server",
    organizerUserId: "organizer-server-owned",
    organizerTourId: "tour-1",
    tourId: "tour-1",
    tourSlug: "native-tour",
    tourTitle: "Канонический тур",
    tourImage: "/tour.jpg",
    status: "new",
    guests: command.travelers.adults + (command.travelers.children ?? 0),
    startDate: command.startDate,
    totalPriceUsd: command.intent === "price_quote" ? 0 : 840,
    priceQuoteRequest: command.intent === "price_quote",
    contactName: command.customer.name,
    contactEmail: command.customer.email,
    contactPhone: command.customer.phone ?? "",
    organizerComments: [],
    statusHistory: [],
    paymentStatus: "pending",
    travelers: [{
      id: "traveler-private",
      fullName: "Иван Иванов",
      dateOfBirth: "1990-01-01",
      passportNumber: "PRIVATE-PASSPORT",
    }],
    travelersFormToken: "PRIVATE-TRAVELERS-TOKEN",
    paymentLinkToken: "PRIVATE-PAYMENT-TOKEN",
    clientPortalToken: "PRIVATE-PORTAL-TOKEN",
    metadata: { requestFingerprint: fingerprint, idempotencyKeyHash: "PRIVATE-HASH" },
    createdAt: "2026-07-29T10:00:00.000Z",
    updatedAt: "2026-07-29T10:00:00.000Z",
  };
}

describe("POST /api/bookings route integration", () => {
  beforeEach(() => {
    mocks.enabled = true;
    mocks.authUser = { id: "auth-user", email: "ivan@example.com" };
    mocks.stored.clear();
    mocks.reservations = 0;
    mocks.verifyProtection.mockReset().mockResolvedValue({ ok: true });
    mocks.fetchNavigation.mockReset().mockResolvedValue({
      showTours: true,
      showExcursions: true,
    });
    mocks.ensureAvailability.mockReset().mockResolvedValue(true);
    mocks.attachGuest.mockReset().mockImplementation(async () => {
      if (!mocks.authUser?.email) return 0;
      let attached = 0;
      for (const stored of mocks.stored.values()) {
        if (
          stored.booking.userId.startsWith("guest-") &&
          stored.booking.contactEmail.toLowerCase() === mocks.authUser.email.toLowerCase()
        ) {
          stored.booking.userId = mocks.authUser.id;
          attached += 1;
        }
      }
      return attached;
    });
    mocks.notifyCreated.mockReset().mockResolvedValue(undefined);
    mocks.addBreadcrumb.mockReset();
    mocks.captureException.mockReset();
    mocks.buildCanonical.mockReset().mockImplementation(
      async (_admin: unknown, command: CreateBookingCommand, authUserId?: string | null) => ({
        booking: canonicalBooking(command, authUserId),
        organizerUserId: "organizer-server-owned",
        requestFingerprint: JSON.stringify(command),
        productKind: "tour" as const,
        reservationSlotDate:
          command.intent === "price_quote" ? undefined : command.startDate,
      }),
    );
    mocks.insertAtomic.mockReset().mockImplementation(
      async (_admin: unknown, input: {
        booking: Booking;
        organizerUserId: string;
        slotDate?: string;
      }) => {
        const fingerprint = String(input.booking.metadata?.requestFingerprint ?? "");
        const existing = mocks.stored.get(input.booking.id);
        if (existing) {
          if (existing.fingerprint !== fingerprint) {
            return {
              error: "Эта форма уже использовалась для другой заявки. Обновите страницу.",
              status: 409,
            };
          }
          if (existing.booking.userId !== input.booking.userId) {
            return {
              error: "Эта форма уже использовалась для другой заявки. Обновите страницу.",
              status: 409,
            };
          }
          return { booking: structuredClone(existing.booking), created: false };
        }
        if (input.slotDate) mocks.reservations += input.booking.guests;
        mocks.stored.set(input.booking.id, {
          booking: structuredClone(input.booking),
          fingerprint,
        });
        return { booking: structuredClone(input.booking), created: true };
      },
    );
  });

  it("creates a canonical booking through the atomic command and enqueues notification only once", async () => {
    const injected = {
      ...baseCommand,
      totalPriceUsd: 1,
      organizerUserId: "attacker",
      paymentStatus: "paid",
      status: "completed",
    };

    const first = await POST(request(injected));
    const second = await POST(request(injected));

    expect([first.status, second.status]).toEqual([200, 200]);
    expect(mocks.buildCanonical).toHaveBeenNthCalledWith(
      1,
      mocks.admin,
      expect.not.objectContaining({
        totalPriceUsd: expect.anything(),
        organizerUserId: expect.anything(),
        paymentStatus: expect.anything(),
        status: expect.anything(),
      }),
      "auth-user",
    );
    expect(mocks.ensureAvailability).toHaveBeenCalledWith(mocks.admin, {
      tourId: "tour-1",
      tourSlug: "native-tour",
      startDate: "2026-12-20",
    });
    expect(mocks.insertAtomic).toHaveBeenNthCalledWith(1, mocks.admin, {
      booking: expect.objectContaining({
        totalPriceUsd: 840,
        organizerUserId: "organizer-server-owned",
        paymentStatus: "pending",
        status: "new",
      }),
      organizerUserId: "organizer-server-owned",
      slotDate: "2026-12-20",
    });
    expect(mocks.reservations).toBe(2);
    expect(mocks.notifyCreated).toHaveBeenCalledTimes(1);
    await expect(first.json()).resolves.toEqual({
      booking: { id: canonicalBooking(baseCommand, "auth-user").id },
    });
    await expect(second.json()).resolves.toEqual({
      booking: { id: canonicalBooking(baseCommand, "auth-user").id },
    });
  });

  it("binds exact replay to the authenticated actor without exposing the stored booking", async () => {
    const first = await POST(request());
    mocks.authUser = { id: "other-user", email: "other@example.com" };

    const replay = await POST(request());

    expect(first.status).toBe(200);
    expect(replay.status).toBe(409);
    await expect(replay.json()).resolves.toEqual({
      error: "Эта форма уже использовалась для другой заявки. Обновите страницу.",
    });
    expect(mocks.reservations).toBe(2);
    expect(mocks.notifyCreated).toHaveBeenCalledTimes(1);
  });

  it("allows an exact guest replay with the same derived guest actor", async () => {
    mocks.authUser = null;

    const first = await POST(request());
    const replay = await POST(request());

    expect([first.status, replay.status]).toEqual([200, 200]);
    expect(mocks.attachGuest).not.toHaveBeenCalled();
    expect(mocks.reservations).toBe(2);
    expect(mocks.notifyCreated).toHaveBeenCalledTimes(1);
    await expect(replay.json()).resolves.toEqual({
      booking: { id: canonicalBooking(baseCommand).id },
    });
  });

  it("allows a confirmed same-email account to attach and replay its guest booking", async () => {
    mocks.authUser = null;
    const guestCreate = await POST(request());
    mocks.authUser = { id: "confirmed-user", email: "ivan@example.com" };

    const attachedReplay = await POST(request());

    expect([guestCreate.status, attachedReplay.status]).toEqual([200, 200]);
    expect(mocks.attachGuest).toHaveBeenCalledTimes(1);
    expect(mocks.reservations).toBe(2);
    expect(mocks.notifyCreated).toHaveBeenCalledTimes(1);
    await expect(attachedReplay.json()).resolves.toEqual({
      booking: { id: canonicalBooking(baseCommand).id },
    });
  });

  it("rejects guest replay from an unrelated authenticated account", async () => {
    mocks.authUser = null;
    const guestCreate = await POST(request());
    mocks.authUser = { id: "unrelated-user", email: "other@example.com" };

    const replay = await POST(request());

    expect(guestCreate.status).toBe(200);
    expect(replay.status).toBe(409);
    expect(mocks.reservations).toBe(2);
    expect(mocks.notifyCreated).toHaveBeenCalledTimes(1);
  });

  it("stores a price quote without reserving inventory", async () => {
    const response = await POST(request({ ...baseCommand, intent: "price_quote" }));

    expect(response.status).toBe(200);
    expect(mocks.ensureAvailability).not.toHaveBeenCalled();
    expect(mocks.insertAtomic).toHaveBeenCalledWith(
      mocks.admin,
      expect.objectContaining({
        booking: expect.objectContaining({ priceQuoteRequest: true, totalPriceUsd: 0 }),
        slotDate: undefined,
      }),
    );
    expect(mocks.reservations).toBe(0);
    expect(mocks.notifyCreated).toHaveBeenCalledTimes(1);
  });

  it("fails closed before persistence when a required slot cannot be confirmed", async () => {
    mocks.ensureAvailability.mockResolvedValueOnce(false);

    const response = await POST(request());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      code: "BOOKING_AVAILABILITY_UNAVAILABLE",
      error: "Не удалось подтвердить доступность мест. Выберите другую дату или попробуйте позже.",
    });
    expect(mocks.insertAtomic).not.toHaveBeenCalled();
    expect(mocks.notifyCreated).not.toHaveBeenCalled();
  });

  it("returns an idempotency conflict without a second reservation or notification", async () => {
    const first = await POST(request());
    const changed = await POST(request({
      ...baseCommand,
      travelers: { adults: 3 },
    }));

    expect(first.status).toBe(200);
    expect(changed.status).toBe(409);
    expect(mocks.reservations).toBe(2);
    expect(mocks.notifyCreated).toHaveBeenCalledTimes(1);
  });

  it("preserves a canonical slot conflict and never reports success", async () => {
    mocks.insertAtomic.mockResolvedValueOnce({
      error: "На выбранную дату уже недостаточно мест.",
      status: 409,
    });

    const response = await POST(request());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "На выбранную дату уже недостаточно мест.",
    });
    expect(mocks.notifyCreated).not.toHaveBeenCalled();
  });

  it("does not expose unexpected storage errors", async () => {
    mocks.insertAtomic.mockRejectedValueOnce(
      new Error("postgres://service_role:secret@internal/relation bookings missing"),
    );

    const response = await POST(request());
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({
      code: "BOOKING_SERVICE_UNAVAILABLE",
      error: "Не удалось завершить бронирование здесь. Попробуйте позже или продолжите на сайте партнёра.",
    });
    expect(JSON.stringify(payload)).not.toContain("service_role");
    expect(JSON.stringify(payload)).not.toContain("relation bookings");
    expect(mocks.captureException).toHaveBeenCalledTimes(1);
    expect(mocks.notifyCreated).not.toHaveBeenCalled();
  });

  it("blocks an invalid guest-form challenge before canonical or storage effects", async () => {
    mocks.verifyProtection.mockResolvedValueOnce({ ok: false, kind: "challenge" });

    const response = await POST(request());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      code: "BOOKING_VERIFICATION_FAILED",
      error: "Не удалось подтвердить отправку формы. Обновите страницу и попробуйте снова.",
    });
    expect(mocks.buildCanonical).not.toHaveBeenCalled();
    expect(mocks.ensureAvailability).not.toHaveBeenCalled();
    expect(mocks.insertAtomic).not.toHaveBeenCalled();
  });

  it("stops at the feature boundary before form and storage effects", async () => {
    mocks.enabled = false;

    const response = await POST(request());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      code: "BOOKING_SERVICE_UNAVAILABLE",
      error: "Не удалось завершить бронирование здесь. Попробуйте позже или продолжите на сайте партнёра.",
    });
    expect(mocks.verifyProtection).not.toHaveBeenCalled();
    expect(mocks.buildCanonical).not.toHaveBeenCalled();
    expect(mocks.insertAtomic).not.toHaveBeenCalled();
  });
});
