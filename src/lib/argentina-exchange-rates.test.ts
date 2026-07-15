import { describe, expect, it } from "vitest";

import { parseBcraUsdQuote } from "./argentina-exchange-rates";

describe("BCRA USD quote", () => {
  it("parses the official exchange-statistics response", () => {
    expect(
      parseBcraUsdQuote({
        status: 200,
        results: [
          {
            fecha: "2026-07-14",
            detalle: [
              {
                codigoMoneda: "USD",
                descripcion: "DOLAR E.E.U.U.",
                tipoPase: 0,
                tipoCotizacion: 1471.5,
              },
            ],
          },
        ],
      })
    ).toMatchObject({ rate: 1471.5, rateType: "official_reference" });
  });

  it("rejects a malformed response", () => {
    expect(parseBcraUsdQuote({ status: 200, results: [] })).toBeNull();
  });
});
