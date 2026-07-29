import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Booking } from "@/types/tourist";

const mocks = vi.hoisted(() => ({
  stored: null as Booking | null,
  fetchBooking: vi.fn(),
  updateBooking: vi.fn(),
  createPreference: vi.fn(),
  createCheckoutSession: vi.fn(),
  breadcrumb: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/lib/auth-mode", () => ({ isSupabaseBookingsEnabled: () => true }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: () => ({}) }));
vi.mock("@/lib/bookings-store", () => ({ normalizeBooking: (booking: Booking) => booking }));
vi.mock("@/lib/bookings-server", () => ({
  fetchBookingById: mocks.fetchBooking,
  updateBookingRecord: mocks.updateBooking,
}));
vi.mock("@/lib/payments/mercadopago-client", () => ({
  createPreference: mocks.createPreference,
}));
vi.mock("@/lib/payments/stripe-client", () => ({
  createCheckoutSession: mocks.createCheckoutSession,
  isStripeConfigured: () => true,
}));
vi.mock("@/lib/monitoring/sentry", () => ({
  addPaymentBreadcrumb: mocks.breadcrumb,
  captureException: mocks.captureException,
}));

import { POST as createMercadoPagoPreference } from "@/app/api/bookings/[id]/payment/preference/route";
import { POST as createStripeSession } from "@/app/api/bookings/[id]/payment/stripe/session/route";

const originalMercadoPagoToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const originalStripeKey = process.env.STRIPE_SECRET_KEY;

function booking(gateway: "manual" | "mercadopago" | "stripe" = "manual"): Booking {
  return {
    id: "booking-1",
    userId: "user-1",
    tourId: "tour-1",
    tourSlug: "buenos-aires",
    tourTitle: "Буэнос-Айрес",
    tourImage: "/tour.jpg",
    status: "waiting_payment",
    guests: 2,
    totalPriceUsd: 240,
    contactName: "Иван",
    contactEmail: "ivan@example.com",
    contactPhone: "+5491112345678",
    organizerComments: [],
    statusHistory: [],
    paymentLink: {
      token: "pay-secret",
      createdAt: "2026-07-20T10:00:00.000Z",
      expiresAt: "2099-07-30T10:00:00.000Z",
      status: "active",
      target: "full",
      amountUsd: 240,
      gateway,
    },
    metadata: { checkoutCurrency: "USD" },
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.000Z",
  };
}

function request(path: string, token = "pay-secret") {
  return new Request(`https://attacker.example${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ paymentLinkToken: token }),
  });
}

const context = { params: Promise.resolve({ id: "booking-1" }) };

describe("payment checkout route integration", () => {
  beforeEach(() => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "mp-test-token";
    process.env.STRIPE_SECRET_KEY = "sk_test_key";
    mocks.stored = booking();
    mocks.fetchBooking.mockReset().mockImplementation(async () =>
      mocks.stored ? structuredClone(mocks.stored) : null,
    );
    mocks.updateBooking.mockReset().mockImplementation(
      async (_supabase: unknown, next: Booking, expectedUpdatedAt?: string) => {
        if (!mocks.stored || expectedUpdatedAt !== mocks.stored.updatedAt) {
          return { error: "concurrent update", status: 409 };
        }
        mocks.stored = structuredClone(next);
        return { booking: structuredClone(next) };
      },
    );
    mocks.createPreference.mockReset().mockResolvedValue({
      preferenceId: "pref-1",
      checkoutUrl: "https://mercadopago.example/checkout/pref-1",
      sandboxCheckoutUrl: "https://sandbox.mercadopago.example/checkout/pref-1",
    });
    mocks.createCheckoutSession.mockReset().mockResolvedValue({
      sessionId: "cs_1",
      checkoutUrl: "https://checkout.stripe.example/cs_1",
    });
    mocks.breadcrumb.mockReset();
    mocks.captureException.mockReset();
  });

  afterAll(() => {
    if (originalMercadoPagoToken === undefined) delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    else process.env.MERCADOPAGO_ACCESS_TOKEN = originalMercadoPagoToken;
    if (originalStripeKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = originalStripeKey;
  });

  it("claims Mercado Pago before provider creation and never trusts the request origin", async () => {
    const response = await createMercadoPagoPreference(
      request("/api/bookings/booking-1/payment/preference"),
      context,
    );

    expect(response.status).toBe(200);
    expect(mocks.updateBooking).toHaveBeenCalledTimes(2);
    expect(mocks.updateBooking.mock.calls[0]?.[1].paymentLink.gateway).toBe("mercadopago");
    expect(mocks.updateBooking.mock.calls[0]?.[2]).toBe("2026-07-20T10:00:00.000Z");
    expect(mocks.createPreference).toHaveBeenCalledWith(
      expect.objectContaining({ paymentLink: expect.objectContaining({ gateway: "mercadopago" }) }),
      expect.not.objectContaining({ baseUrl: expect.anything() }),
    );
    expect(mocks.updateBooking.mock.calls[1]?.[2]).toBe(
      mocks.updateBooking.mock.calls[0]?.[1].updatedAt,
    );
  });

  it("claims Stripe before provider creation and returns only public-safe failures", async () => {
    mocks.createCheckoutSession.mockRejectedValueOnce(new Error("sk_live_secret leaked upstream"));

    const response = await createStripeSession(
      request("/api/bookings/booking-1/payment/stripe/session"),
      context,
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      code: "PAYMENT_PROCESSING_FAILED",
      error: "Не удалось открыть оплату. Попробуйте снова или обратитесь в поддержку.",
    });
    expect(mocks.stored?.paymentLink?.gateway).toBe("stripe");
    expect(mocks.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ paymentLink: expect.objectContaining({ gateway: "stripe" }) }),
      expect.not.objectContaining({ baseUrl: expect.anything() }),
    );
  });

  it("lets only one provider create checkout under a cross-provider race", async () => {
    const [mercadoPagoResponse, stripeResponse] = await Promise.all([
      createMercadoPagoPreference(
        request("/api/bookings/booking-1/payment/preference"),
        context,
      ),
      createStripeSession(
        request("/api/bookings/booking-1/payment/stripe/session"),
        context,
      ),
    ]);

    expect([mercadoPagoResponse.status, stripeResponse.status].sort()).toEqual([200, 409]);
    expect(mocks.createPreference.mock.calls.length + mocks.createCheckoutSession.mock.calls.length).toBe(1);
    expect(mocks.stored?.paymentLink?.gateway).toBe(
      mocks.createPreference.mock.calls.length === 1 ? "mercadopago" : "stripe",
    );
  });

  it("rejects another provider after the payment link has been claimed", async () => {
    mocks.stored = booking("stripe");

    const response = await createMercadoPagoPreference(
      request("/api/bookings/booking-1/payment/preference"),
      context,
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(expect.objectContaining({
      code: "PAYMENT_PROVIDER_LOCKED",
    }));
    expect(mocks.createPreference).not.toHaveBeenCalled();
    expect(mocks.updateBooking).not.toHaveBeenCalled();
  });

  it("rejects an invalid capability token before every provider side effect", async () => {
    const [mercadoPagoResponse, stripeResponse] = await Promise.all([
      createMercadoPagoPreference(
        request("/api/bookings/booking-1/payment/preference", "wrong-token"),
        context,
      ),
      createStripeSession(
        request("/api/bookings/booking-1/payment/stripe/session", "wrong-token"),
        context,
      ),
    ]);

    expect([mercadoPagoResponse.status, stripeResponse.status]).toEqual([403, 403]);
    expect(mocks.createPreference).not.toHaveBeenCalled();
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
    expect(mocks.updateBooking).not.toHaveBeenCalled();
  });

  it("never overwrites a paid webhook update after provider creation", async () => {
    mocks.updateBooking.mockImplementationOnce(async (_supabase, next: Booking) => {
      mocks.stored = structuredClone(next);
      return { booking: structuredClone(next) };
    });
    mocks.createPreference.mockImplementationOnce(async () => {
      mocks.stored = {
        ...mocks.stored!,
        paymentStatus: "paid",
        paymentLink: { ...mocks.stored!.paymentLink!, status: "paid" },
        updatedAt: "2026-07-29T12:00:00.000Z",
      };
      return {
        preferenceId: "pref-1",
        checkoutUrl: "https://mercadopago.example/checkout/pref-1",
      };
    });

    const response = await createMercadoPagoPreference(
      request("/api/bookings/booking-1/payment/preference"),
      context,
    );

    expect(response.status).toBe(409);
    expect(mocks.stored?.paymentStatus).toBe("paid");
    expect(mocks.stored?.paymentLink?.status).toBe("paid");
    await expect(response.json()).resolves.toEqual(expect.objectContaining({
      code: "PAYMENT_PROCESSING_FAILED",
    }));
  });

  it("reuses an existing same-provider checkout without another side effect", async () => {
    mocks.stored = {
      ...booking("stripe"),
      paymentLink: {
        ...booking("stripe").paymentLink!,
        sessionId: "cs_existing",
        checkoutUrl: "https://checkout.stripe.example/cs_existing",
      },
    };

    const response = await createStripeSession(
      request("/api/bookings/booking-1/payment/stripe/session"),
      context,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sessionId: "cs_existing",
      checkoutUrl: "https://checkout.stripe.example/cs_existing",
    });
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
    expect(mocks.updateBooking).not.toHaveBeenCalled();
  });
});
