import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/bookings-notify", () => ({
  notifyBookingCreatedEmail: vi.fn(),
  notifyPaymentReceivedEmail: vi.fn(),
}));

import { POST } from "@/app/api/bookings/notify/route";

describe("POST /api/bookings/notify", () => {
  it("does not accept public requests for branded email", async () => {
    const response = await POST();

    expect(response.status).toBe(404);
  });
});
