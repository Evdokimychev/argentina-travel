import { describe, expect, it } from "vitest";
import {
  PUBLIC_API_ERROR_MESSAGES,
  publicApiError,
  resolvePublicApiErrorMessage,
} from "@/lib/public-api/safe-error";

describe("safe public API errors", () => {
  it("returns stable codes with owner-safe messages", () => {
    expect(publicApiError("PAYMENT_UNAVAILABLE")).toEqual({
      code: "PAYMENT_UNAVAILABLE",
      error: PUBLIC_API_ERROR_MESSAGES.PAYMENT_UNAVAILABLE,
    });
  });

  it("does not reflect unknown provider errors", () => {
    expect(resolvePublicApiErrorMessage("RAW_PROVIDER_SECRET"))
      .toBe(PUBLIC_API_ERROR_MESSAGES.SERVICE_UNAVAILABLE);
  });
});
