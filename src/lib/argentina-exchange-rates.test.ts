import { afterEach, describe, expect, it, vi } from "vitest";
import { getArgentinaExchangeRates, latestExchangeRateUpdate } from "./argentina-exchange-rates";

afterEach(() => vi.unstubAllGlobals());

describe("Argentina exchange rates", () => {
  it("uses BCRA as the official source and keeps the informal quote separate", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: 200,
        results: [{
          fecha: "2026-07-16",
          detalle: [{ codigoMoneda: "USD", tipoCotizacion: 1476 }],
        }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        compra: 1500,
        venta: 1520,
        fechaActualizacion: "2026-07-16T15:00:00-03:00",
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getArgentinaExchangeRates();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.oficial).toMatchObject({
      reference: 1476,
      sourceKind: "official",
      sourceName: "Banco Central Аргентины (BCRA)",
    });
    expect(result.data.blue).toMatchObject({
      buy: 1500,
      sell: 1520,
      sourceKind: "informal_reference",
    });
    expect(latestExchangeRateUpdate(result.data)).toBe("2026-07-16T15:00:00-03:00");
  });

  it("still returns the official quote when the informal source is unavailable", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: 200,
        results: [{
          fecha: "2026-07-16",
          detalle: [{ codigoMoneda: "USD", tipoCotizacion: 1476 }],
        }],
      }), { status: 200 }))
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getArgentinaExchangeRates();
    expect(result).toMatchObject({ ok: true, data: { blue: undefined } });
  });

  it("fails closed when BCRA does not return a valid official quote", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 200, results: [] }), { status: 200 }),
    ));
    await expect(getArgentinaExchangeRates()).resolves.toMatchObject({ ok: false });
  });
});
