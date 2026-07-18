import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  disabledPartnerCapabilities,
  externalPartnerCapabilities,
  resolveExcursionOfferCapabilities,
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
      supportOwner: "partner",
      retryMode: "partner_handoff",
    });
  });

  it("keeps an API-assisted Tripster excursion partner-owned", () => {
    expect(
      resolveExcursionOfferCapabilities({
        partner: "tripster",
        bookingHref: "/api/affiliate/go/tripster-demo",
        isBookable: true,
        tripsterPartnerApiConfigured: true,
      })
    ).toMatchObject({
      bookingMode: "external_partner",
      experienceType: "excursion",
      source: "tripster",
      confirmationMode: "partner",
      supportOwner: "partner",
    });
  });

  it("keeps Sputnik8 affiliate-only even without native booking", () => {
    expect(
      resolveExcursionOfferCapabilities({
        partner: "sputnik8",
        bookingHref: "/api/affiliate/go/sputnik-demo",
        isBookable: false,
      })
    ).toMatchObject({
      bookingMode: "external_partner",
      paymentMode: "partner",
      source: "sputnik8",
      confirmationMode: "partner",
    });
  });

  it("does not offer booking for a Tripster-disabled excursion", () => {
    expect(
      resolveExcursionOfferCapabilities({
        partner: "tripster",
        bookingHref: "/api/affiliate/go/tripster-demo",
        isBookable: false,
      })
    ).toMatchObject({ bookingMode: "disabled", paymentMode: "none" });
  });

  it("maps a first-party excursion request to the platform", () => {
    expect(
      resolveExcursionOfferCapabilities({
        partner: "platform",
        bookingHref: "",
        platformTourId: "native-excursion",
        platformBookingMode: "on_request",
      })
    ).toMatchObject({
      bookingMode: "internal_request",
      source: "goargentina",
      experienceType: "excursion",
      primaryActionLabel: "Оставить заявку",
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
