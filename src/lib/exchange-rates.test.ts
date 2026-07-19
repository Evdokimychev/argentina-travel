import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLiveExchangeRates, requireLiveRateFromUsd } from "./exchange-rates";

afterEach(() => vi.unstubAllGlobals());

describe("exchange rate freshness", () => {
  it("marks currencies missing from the provider as static fallbacks", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      date: "2026-07-16",
      rates: { EUR: 0.87, GBP: 0.74 },
    }), { status: 200 })));

    const payload = await fetchLiveExchangeRates();
    expect(payload.source).toBe("frankfurter_partial");
    expect(payload.updatedAt).toBe("2026-07-16T12:00:00.000Z");
    expect(payload.liveCurrencies).toEqual(expect.arrayContaining(["USD", "EUR", "GBP"]));
    expect(payload.fallbackCurrencies).toContain("ARS");
    expect(() => requireLiveRateFromUsd(payload, "ARS")).toThrow(/unavailable/i);
    expect(requireLiveRateFromUsd(payload, "EUR")).toBe(0.87);
  });

  it("does not present fallback rates as freshly updated", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const payload = await fetchLiveExchangeRates();
    expect(payload).toMatchObject({ source: "fallback", updatedAt: null });
    expect(() => requireLiveRateFromUsd(payload, "EUR")).toThrow(/unavailable/i);
    expect(requireLiveRateFromUsd(payload, "USD")).toBe(1);
  });
});
