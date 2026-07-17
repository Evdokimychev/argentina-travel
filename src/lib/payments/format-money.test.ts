import { describe, expect, it } from "vitest";
import { formatLedgerAmount } from "@/lib/payments/format-money";

describe("formatLedgerAmount", () => {
  it("formats supported ledger currencies", () => {
    expect(formatLedgerAmount(1234.5, "RUB")).toContain("1\u00a0234,5");
  });

  it("does not throw for an unsupported currency", () => {
    expect(formatLedgerAmount(1234.5, "btc")).toBe("1\u00a0234,5 BTC");
  });

  it("explains invalid amounts and missing currencies", () => {
    expect(formatLedgerAmount(Number.NaN, "USD")).toBe("Некорректная сумма");
    expect(formatLedgerAmount(10, " ")).toBe("10 валюта не указана");
  });
});
