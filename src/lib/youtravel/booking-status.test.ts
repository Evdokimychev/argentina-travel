import { describe, expect, it, vi } from "vitest";
import {
  formatYouTravelBookingStatus,
  isYouTravelBookingStatusTerminal,
  resolveYouTravelBookingStatusTone,
  YOUTRAVEL_BOOKING_STATUS_LABELS,
} from "@/lib/youtravel/booking-status";

describe("YouTravel booking status labels", () => {
  it("exposes Russian labels for known statuses", () => {
    expect(YOUTRAVEL_BOOKING_STATUS_LABELS.submitted).toBe("Отправлена");
    expect(YOUTRAVEL_BOOKING_STATUS_LABELS.affiliate_fallback).toBe("Перенаправлена на сайт");
    expect(YOUTRAVEL_BOOKING_STATUS_LABELS.api_unauthorized).toBe("API не активирован");
  });

  it("formats unknown status gracefully", () => {
    expect(formatYouTravelBookingStatus("custom_status")).toBe("custom_status");
    expect(formatYouTravelBookingStatus(null)).toBe("Статус уточняется");
  });
});

describe("YouTravel booking status tone", () => {
  it("maps success and warning tones", () => {
    expect(resolveYouTravelBookingStatusTone("confirmed")).toBe("success");
    expect(resolveYouTravelBookingStatusTone("pending")).toBe("warning");
  });

  it("maps error tones for API failures", () => {
    expect(resolveYouTravelBookingStatusTone("api_unauthorized")).toBe("error");
    expect(resolveYouTravelBookingStatusTone("failed")).toBe("error");
  });

  it("maps affiliate fallback to neutral", () => {
    expect(resolveYouTravelBookingStatusTone("affiliate_fallback")).toBe("neutral");
  });
});

describe("YouTravel booking terminal statuses", () => {
  it("treats affiliate_fallback and completed as terminal", () => {
    expect(isYouTravelBookingStatusTerminal("affiliate_fallback")).toBe(true);
    expect(isYouTravelBookingStatusTerminal("completed")).toBe(true);
    expect(isYouTravelBookingStatusTerminal("cancelled")).toBe(true);
    expect(isYouTravelBookingStatusTerminal("failed")).toBe(true);
  });

  it("treats active statuses as non-terminal", () => {
    expect(isYouTravelBookingStatusTerminal("pending")).toBe(false);
    expect(isYouTravelBookingStatusTerminal("submitted")).toBe(false);
    expect(isYouTravelBookingStatusTerminal("confirmed")).toBe(false);
    expect(isYouTravelBookingStatusTerminal("api_unauthorized")).toBe(false);
  });
});

describe("refreshYouTravelBookingStatus", () => {
  it("returns unchanged when request has no order id", async () => {
    vi.resetModules();

    const fetchById = vi.fn().mockResolvedValue({
      id: "req-1",
      youtravelOrderId: null,
      youtravelStatus: "affiliate_fallback",
    });

    vi.doMock("@/lib/youtravel/booking-requests-server", () => ({
      fetchYouTravelBookingRequestById: fetchById,
      updateYouTravelBookingRequestStatus: vi.fn(),
    }));

    const { refreshYouTravelBookingStatus } = await import("@/lib/youtravel/booking-status-sync");
    const supabase = {} as never;
    const result = await refreshYouTravelBookingStatus(supabase, "req-1");

    expect(result?.youtravelOrderId).toBeNull();
    expect(fetchById).toHaveBeenCalledTimes(1);
  });
});
