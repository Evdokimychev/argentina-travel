import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  disabledPartnerCapabilities,
  externalPartnerCapabilities,
  resolveTourOfferCapabilities,
} from "@/lib/product-capabilities";

describe("offer capabilities", () => {
  it("makes partner ownership explicit", () => {
    expect(externalPartnerCapabilities("tripster")).toMatchObject({
      bookingMode: "external_partner",
      paymentMode: "partner",
      messagingMode: "partner",
      source: "tripster",
      cancellationOwner: "partner",
    });
  });

  it("cannot expose a booking CTA for a disabled partner offer", () => {
    expect(disabledPartnerCapabilities("tripster")).toMatchObject({
      bookingMode: "disabled",
      paymentMode: "none",
      primaryActionLabel: "Бронирование недоступно",
    });
  });

  it("resolves native requests without promising online payment", () => {
    expect(resolveTourOfferCapabilities({ bookingMode: "on_request" })).toMatchObject({
      bookingMode: "internal_request",
      paymentMode: "manual",
      source: "goargentina",
    });
  });

  it("maps Tripster is_bookable=false to a disabled capability", () => {
    const mapper = readFileSync(
      join(process.cwd(), "src/lib/tripster/partner-tour-mapper.ts"),
      "utf8"
    );
    expect(mapper).toContain("experience.is_bookable === false");
    expect(mapper).toContain('disabledPartnerCapabilities("tripster")');
  });
});
