import { describe, expect, it } from "vitest";
import { formatFilterAmount, parseFilterAmount } from "@/lib/currency";

describe("parseFilterAmount", () => {
  it("accepts plain digits", () => {
    expect(parseFilterAmount("5628")).toBe(5628);
  });

  it("strips spaces and narrow no-break spaces", () => {
    expect(parseFilterAmount("828 028")).toBe(828028);
    expect(parseFilterAmount("5\u202f628")).toBe(5628);
  });

  it("returns null for empty input", () => {
    expect(parseFilterAmount("")).toBeNull();
    expect(parseFilterAmount("   ")).toBeNull();
  });
});

describe("formatFilterAmount roundtrip", () => {
  it("keeps value after format and parse", () => {
    const value = 828028;
    const formatted = formatFilterAmount(value, "ru");
    expect(parseFilterAmount(formatted)).toBe(value);
  });
});
