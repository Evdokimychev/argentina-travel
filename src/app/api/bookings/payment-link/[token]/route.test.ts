import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Booking } from "@/types/tourist";

const mocks = vi.hoisted(() => ({
  fetchBooking: vi.fn(),
  fetchReceipt: vi.fn(),
}));

vi.mock("@/lib/auth-mode", () => ({ isSupabaseBookingsEnabled: () => true }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: () => ({}) }));
vi.mock("@/lib/bookings-server", () => ({
  fetchBookingByPaymentLinkToken: mocks.fetchBooking,
}));
vi.mock("@/lib/payments/transaction-server", () => ({
  fetchLatestChargeReceiptForBooking: mocks.fetchReceipt,
}));

import { GET } from "@/app/api/bookings/payment-link/[token]/route";

function booking(): Booking {
  return {
    id: "booking-1",
    userId: "user-1",
    organizerUserId: "organizer-1",
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
    organizerComments: [{
      id: "private-comment",
      text: "Внутренняя заметка CRM",
      authorName: "Организатор",
      createdAt: "2026-07-20T10:00:00.000Z",
    }],
    travelers: [{
      id: "traveler-1",
      fullName: "Иван Иванов",
      dateOfBirth: "1990-01-01",
      passportNumber: "PRIVATE-PASSPORT",
    }],
    statusHistory: [],
    paymentLink: {
      token: "pay-secret",
      createdAt: "2026-07-20T10:00:00.000Z",
      expiresAt: "2099-07-30T10:00:00.000Z",
      status: "active",
      target: "full",
      amountUsd: 240,
      gateway: "stripe",
    },
    metadata: {
      checkoutCurrency: "USD",
      idempotencyKeyHash: "private-idempotency-hash",
      requestFingerprint: "private-request-fingerprint",
    },
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.000Z",
  };
}

function context(token = "pay-secret") {
  return { params: Promise.resolve({ token }) };
}

describe("GET /api/bookings/payment-link/[token]", () => {
  beforeEach(() => {
    mocks.fetchBooking.mockReset().mockResolvedValue(booking());
    mocks.fetchReceipt.mockReset().mockResolvedValue(null);
  });

  it("returns only the bounded checkout projection for a valid capability token", async () => {
    const response = await GET(new Request("https://attacker.example/status"), context());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.booking).toEqual({
      id: "booking-1",
      tourTitle: "Буэнос-Айрес",
      contactName: "Иван",
      contactEmail: "ivan@example.com",
      paymentLink: booking().paymentLink,
      metadata: { checkoutCurrency: "USD" },
    });
    expect(JSON.stringify(payload)).not.toContain("PRIVATE-PASSPORT");
    expect(JSON.stringify(payload)).not.toContain("Внутренняя заметка CRM");
    expect(payload.booking).not.toHaveProperty("contactPhone");
    expect(payload.booking).not.toHaveProperty("userId");
  });

  it("returns a public-safe unavailable response without leaking storage errors", async () => {
    mocks.fetchBooking.mockRejectedValueOnce(new Error("supabaseKey is required: service-role-secret"));

    const response = await GET(new Request("https://example.test/status"), context());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      code: "SERVICE_UNAVAILABLE",
      error: "Сервис временно недоступен. Попробуйте ещё раз немного позже.",
    });
  });

  it("does not query receipts for an unknown capability token", async () => {
    mocks.fetchBooking.mockResolvedValueOnce(null);

    const response = await GET(new Request("https://example.test/status"), context("unknown"));

    expect(response.status).toBe(404);
    expect(mocks.fetchReceipt).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual(expect.objectContaining({
      code: "PAYMENT_LINK_UNAVAILABLE",
    }));
  });
});
