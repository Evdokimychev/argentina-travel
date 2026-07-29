import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Booking } from "@/types/tourist";

const mocks = vi.hoisted(() => ({
  enabled: true,
  sessionUser: null as Record<string, unknown> | null,
  booking: null as Booking | null,
  createRefundRequest: vi.fn(),
}));

vi.mock("@/lib/auth-mode", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth-mode")>();
  return { ...actual, isSupabaseBookingsEnabled: () => mocks.enabled };
});
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ kind: "session-client" }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ kind: "admin-client" }),
}));
vi.mock("@/lib/supabase-auth-provider", () => ({
  loadSessionUserFromSupabase: async () => mocks.sessionUser,
}));
vi.mock("@/lib/bookings-server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/bookings-server")>();
  return {
    ...actual,
    fetchBookingById: async () => mocks.booking,
  };
});
vi.mock("@/lib/payments/transaction-server", () => ({
  createRefundRequest: mocks.createRefundRequest,
  findLatestRefundForBooking: vi.fn(),
  findPendingRefundForBooking: vi.fn(),
}));

import { POST } from "@/app/api/bookings/[id]/payment/refund/route";

const operationId = "44444444-4444-4444-8444-444444444444";
const context = { params: Promise.resolve({ id: "booking-1" }) };

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-1",
    userId: "tourist-1",
    organizerUserId: "organizer-1",
    organizerTourId: "tour-1",
    tourId: "tour-1",
    tourSlug: "mendoza",
    tourTitle: "Мендоса",
    tourImage: "/tour.jpg",
    status: "confirmed",
    guests: 2,
    startDate: "2026-10-10",
    totalPriceUsd: 500,
    contactName: "Иван",
    contactEmail: "ivan@example.com",
    contactPhone: "+5491112345678",
    organizerComments: [],
    statusHistory: [],
    paymentStatus: "paid",
    paymentLink: { gateway: "mercadopago", amountUsd: 500 } as Booking["paymentLink"],
    createdAt: "2026-07-29T10:00:00.000Z",
    updatedAt: "2026-07-29T10:00:00.000Z",
    ...overrides,
  };
}

function request() {
  return new Request("https://example.test/api/bookings/booking-1/payment/refund", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      operationId,
      reason: "Поездка отменена",
      amountUsd: 1,
    }),
  });
}

describe("POST /api/bookings/[id]/payment/refund", () => {
  beforeEach(() => {
    mocks.enabled = true;
    mocks.booking = booking();
    mocks.sessionUser = {
      id: "tourist-1",
      email: "ivan@example.com",
      roles: ["tourist"],
    };
    mocks.createRefundRequest.mockReset().mockResolvedValue({
      transaction: { id: "refund-1", status: "pending" },
    });
  });

  it("prepares an owner refund without trusting client USD amount or currency", async () => {
    const response = await POST(request(), context);

    expect(response.status).toBe(201);
    expect(mocks.createRefundRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bookingId: "booking-1",
        requestedBy: "tourist-1",
        operationId,
      }),
    );
    expect(mocks.createRefundRequest.mock.calls[0][1]).not.toHaveProperty("amount");
    expect(mocks.createRefundRequest.mock.calls[0][1]).not.toHaveProperty("currency");
    expect(mocks.createRefundRequest.mock.calls[0][1]).not.toHaveProperty("provider");
  });

  it("does not grant a financial mutation from matching email alone", async () => {
    mocks.sessionUser = {
      id: "unrelated-user",
      email: "ivan@example.com",
      roles: ["tourist"],
    };

    const response = await POST(request(), context);

    expect(response.status).toBe(403);
    expect(mocks.createRefundRequest).not.toHaveBeenCalled();
  });

  it("allows the assigned organizer through the shared booking access policy", async () => {
    mocks.sessionUser = {
      id: "organizer-1",
      email: "org@example.com",
      roles: ["organizer"],
    };

    const response = await POST(request(), context);

    expect(response.status).toBe(201);
    expect(mocks.createRefundRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        requestedBy: "organizer-1",
        metadata: expect.objectContaining({ source: "organizer_refund_request_legacy" }),
      }),
    );
  });
});
