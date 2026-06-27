import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tripster/auth", () => ({
  getTripsterAccessToken: vi.fn(async () => "test-token"),
  clearTripsterTokenCache: vi.fn(),
}));

vi.mock("@/lib/tripster/env", () => ({
  getTripsterConfig: () => ({
    partner: "travelpayoutsapi",
    secret: "secret",
    apiBase: "https://experience.tripster.ru/api",
  }),
}));

import {
  buildTripsterRequestId,
  createTripsterExternalOrder,
  TripsterBookingError,
} from "@/lib/tripster/booking-api";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

const basePayload = {
  experience: 276,
  persons_count: 1,
  date: "2026-09-15",
  time: "12:00:00",
  tickets: [{ id: 3917702062, count: 2 }],
  name: "Иван Иванов",
  email: "ivan@example.com",
  phone: "+79991234567",
};

describe("buildTripsterRequestId", () => {
  it("uses the official `{uuid}_{unix_timestamp}` format", () => {
    const id = buildTripsterRequestId();
    expect(id).toMatch(/^[0-9a-f-]{36}_\d{10}$/i);

    const [, ts] = id.split("_");
    const now = Math.floor(Date.now() / 1000);
    expect(Math.abs(Number(ts) - now)).toBeLessThanOrEqual(5);
  });
});

describe("createTripsterExternalOrder", () => {
  const fetchSpy = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    fetchSpy.mockReset();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends Idempotency-Key and X-REQUESTID headers with Bearer auth", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(201, { id: 123, status: "confirmation", url: "/experience/order/123/" })
    );

    const order = await createTripsterExternalOrder(basePayload, "idem-key-1", "req-uuid_1700000000");

    expect(order.id).toBe(123);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://experience.tripster.ru/api/partners/travelpayoutsapi/external_orders/");
    expect(init.method).toBe("POST");

    const headers = init.headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBe("idem-key-1");
    expect(headers["X-REQUESTID"]).toBe("req-uuid_1700000000");
    expect(headers.Authorization).toBe("Bearer test-token");
  });

  it("retries with the legacy `Token` auth scheme on 403", async () => {
    fetchSpy
      .mockResolvedValueOnce(jsonResponse(403, { detail: "У вас нет прав для выполнения этой операции." }))
      .mockResolvedValueOnce(jsonResponse(201, { id: 555, status: "confirmation" }));

    const order = await createTripsterExternalOrder(basePayload, "idem-key-2", "req-uuid_1700000001");

    expect(order.id).toBe(555);
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const firstHeaders = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    const secondHeaders = (fetchSpy.mock.calls[1][1] as RequestInit).headers as Record<string, string>;
    expect(firstHeaders.Authorization).toBe("Bearer test-token");
    expect(secondHeaders.Authorization).toBe("Token test-token");
  });

  it("throws TripsterBookingError when both auth schemes fail", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(403, { detail: "У вас нет прав для выполнения этой операции." })
    );

    await expect(
      createTripsterExternalOrder(basePayload, "idem-key-3", "req-uuid_1700000002")
    ).rejects.toBeInstanceOf(TripsterBookingError);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("does not retry auth scheme on validation errors (400)", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(400, { time: ["Выберите корректное время"] })
    );

    await expect(
      createTripsterExternalOrder(basePayload, "idem-key-4", "req-uuid_1700000003")
    ).rejects.toMatchObject({ status: 400 });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
