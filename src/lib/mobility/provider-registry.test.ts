import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolveMobilityAction, selectMobilityCapabilities } from "@/lib/mobility/provider-registry";
import type { MobilityProviderCapability } from "@/types/mobility";

const generic: MobilityProviderCapability = {
  providerId: "provider-new",
  providerKey: "partner:new-provider",
  vertical: "rental",
  displayName: "Новый поставщик",
  sourceOwnership: "partner",
  capabilityMode: "affiliate_handoff",
  healthStatus: "unknown",
  readinessStatus: "manual_handoff",
  marketId: "uy",
  countryCode: "UY",
  sourceCurrency: "UYU",
  displayCurrency: "USD",
  timezone: "America/Montevideo",
  handoffPath: "/car-rental",
};

describe("generic mobility provider registry", () => {
  it("accepts a new provider without provider-specific source code", () => {
    expect(selectMobilityCapabilities([generic], "rental", "uy")).toEqual([generic]);
    expect(resolveMobilityAction(generic)).toEqual({ kind: "affiliate_handoff", href: "/car-rental" });
    const source = readFileSync("src/lib/mobility/provider-registry.ts", "utf8");
    expect(source).not.toMatch(/localrent|intui/i);
    expect(source).not.toMatch(/switch\s*\(.*provider/i);
  });

  it("does not invent a handoff for an incomplete provider", () => {
    expect(resolveMobilityAction({ ...generic, handoffPath: null })).toEqual({ kind: "unavailable" });
  });
});
