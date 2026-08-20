import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/commerce/business-model", () => ({
  isCommercialModeEnabled: vi.fn(),
}));

import { isCommercialModeEnabled } from "@/lib/commerce/business-model";
import { rejectIfOwnPaymentDisabled, isOwnPaymentRuntimeEnabled } from "@/lib/payments/own-payment-gate";

describe("own payment gate", () => {
  it("blocks when own_payment is disabled", async () => {
    vi.mocked(isCommercialModeEnabled).mockReturnValue(false);
    const res = rejectIfOwnPaymentDisabled();
    expect(res?.status).toBe(503);
    const body = await res!.json();
    expect(body.code).toBe("PAYMENT_UNAVAILABLE");
    expect(isOwnPaymentRuntimeEnabled()).toBe(false);
  });

  it("allows when own_payment is enabled", () => {
    vi.mocked(isCommercialModeEnabled).mockReturnValue(true);
    expect(rejectIfOwnPaymentDisabled()).toBeNull();
    expect(isOwnPaymentRuntimeEnabled()).toBe(true);
  });
});
