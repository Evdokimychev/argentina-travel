import { describe, expect, it } from "vitest";
import {
  PRODUCTION_COMMERCIAL_MODES,
  enabledCommercialModes,
  isCommercialModeEnabled,
  readinessRolesForEnabledModes,
} from "@/lib/commerce/business-model";

describe("business-model", () => {
  it("marks own payment as intentionally disabled", () => {
    expect(isCommercialModeEnabled("own_payment")).toBe(false);
    expect(PRODUCTION_COMMERCIAL_MODES.own_payment.productionEnabled).toBe(false);
    expect(enabledCommercialModes().map((mode) => mode.id)).not.toContain("own_payment");
    expect(readinessRolesForEnabledModes()).not.toContain("payments");
    expect(readinessRolesForEnabledModes()).toEqual(
      expect.arrayContaining(["portal", "affiliate", "leads", "booking", "analytics"]),
    );
  });
});
