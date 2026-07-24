import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_MODULES } from "@/lib/cms/site-globals/normalize";
import { evaluateMobilityModuleAccess } from "@/lib/mobility/module-policy-server";

describe("mobility module kill switches", () => {
  it("fails closed when settings are unavailable", () => {
    expect(evaluateMobilityModuleAccess({ ok: false }, "rental")).toEqual({ allowed: false, reason: "settings_unavailable" });
  });

  it("controls native mobility without coupling the two verticals", () => {
    const base = { ok: true as const, navigation: {} as never, modules: DEFAULT_SITE_MODULES };
    expect(evaluateMobilityModuleAccess({ ...base, modules: { ...DEFAULT_SITE_MODULES, carRentalMode: "disabled" } }, "rental")).toEqual({ allowed: false, reason: "disabled" });
    expect(
      evaluateMobilityModuleAccess(
        {
          ...base,
          modules: {
            ...DEFAULT_SITE_MODULES,
            carRentalMode: "disabled",
            transfersMode: "partner",
          },
        },
        "transfer",
      ),
    ).toEqual({ allowed: true, allowNativeOffers: false });
    expect(evaluateMobilityModuleAccess({ ...base, modules: { ...DEFAULT_SITE_MODULES, transfersMode: "disabled" } }, "transfer")).toEqual({ allowed: false, reason: "disabled" });
    expect(evaluateMobilityModuleAccess({ ...base, modules: { ...DEFAULT_SITE_MODULES, carRentalMode: "partner" } }, "rental")).toEqual({ allowed: true, allowNativeOffers: false });
    expect(evaluateMobilityModuleAccess({ ...base, modules: { ...DEFAULT_SITE_MODULES, carRentalMode: "preparing_hybrid" } }, "rental")).toEqual({ allowed: true, allowNativeOffers: true });
    expect(evaluateMobilityModuleAccess({ ...base, modules: { ...DEFAULT_SITE_MODULES, transfersMode: "request" } }, "transfer")).toEqual({ allowed: true, allowNativeOffers: false });
    expect(evaluateMobilityModuleAccess({ ...base, modules: { ...DEFAULT_SITE_MODULES, transfersMode: "preparing_hybrid" } }, "transfer")).toEqual({ allowed: true, allowNativeOffers: true });
  });
});
