import { describe, expect, it } from "vitest";
import {
  PARTNER_FIELD_OWNERSHIP,
  PARTNER_OFFER_STATE_LABELS,
  partnerFieldOwner,
} from "@/lib/admin/partner-operations";

describe("partner operations contract", () => {
  it("keeps provider-owned commercial fields distinct from editorial overlays", () => {
    expect(partnerFieldOwner("price")).toBe("provider-owned");
    expect(partnerFieldOwner("dates")).toBe("provider-owned");
    expect(partnerFieldOwner("title")).toBe("overrideable");
    expect(partnerFieldOwner("qualityState")).toBe("derived");
    expect(Object.keys(PARTNER_FIELD_OWNERSHIP)).toContain("bookingUrl");
    expect(PARTNER_OFFER_STATE_LABELS.quarantined).toBe("Карантин");
  });
});
