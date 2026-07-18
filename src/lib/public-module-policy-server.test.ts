import { describe, expect, it } from "vitest";
import {
  evaluatePublicModuleAccess,
  type PublicModuleIntent,
} from "@/lib/public-module-policy-server";
import {
  DEFAULT_SITE_MODULES,
  DEFAULT_SITE_NAVIGATION,
} from "@/lib/cms/site-globals/normalize";

describe("public module server policy", () => {
  it("fails closed for public traffic when settings cannot be read", () => {
    expect(evaluatePublicModuleAccess({ ok: false }, "tours", "public_read")).toEqual({
      allowed: false,
      reason: "settings_unavailable",
    });
    expect(evaluatePublicModuleAccess({ ok: false }, "transfers", "public_write")).toEqual({
      allowed: false,
      reason: "settings_unavailable",
    });
    expect(evaluatePublicModuleAccess({ ok: false }, "apartments", "public_read")).toEqual({
      allowed: false,
      reason: "settings_unavailable",
    });
  });

  it("opens native apartments only in the implemented request-first mode", () => {
    for (const apartmentsMode of ["disabled", "request", "preparing_native"] as const) {
      expect(evaluatePublicModuleAccess({ ok: true, navigation: DEFAULT_SITE_NAVIGATION,
        modules: { ...DEFAULT_SITE_MODULES, apartmentsMode } }, "apartments", "public_read")).toEqual({
        allowed: false, reason: "disabled",
      });
    }
    expect(evaluatePublicModuleAccess({ ok: true, navigation: DEFAULT_SITE_NAVIGATION,
      modules: { ...DEFAULT_SITE_MODULES, apartmentsMode: "native_request" } }, "apartments", "public_write")).toEqual({ allowed: true });
  });

  it("blocks tours and transfers from their independent admin switches", () => {
    const snapshot = {
      ok: true as const,
      navigation: { ...DEFAULT_SITE_NAVIGATION, showTours: false },
      modules: { ...DEFAULT_SITE_MODULES, transfersMode: "disabled" as const },
    };

    expect(evaluatePublicModuleAccess(snapshot, "tours", "public_write")).toEqual({
      allowed: false,
      reason: "disabled",
    });
    expect(evaluatePublicModuleAccess(snapshot, "transfers", "public_read")).toEqual({
      allowed: false,
      reason: "disabled",
    });
  });

  it("keeps history, administration and safe exits available", () => {
    const continuityIntents: PublicModuleIntent[] = [
      "history_read",
      "administrative_read",
      "safety_write",
    ];
    for (const intent of continuityIntents) {
      expect(evaluatePublicModuleAccess({ ok: false }, "tours", intent)).toEqual({
        allowed: true,
      });
    }
  });

  it("does not alter enabled partner modes", () => {
    for (const transfersMode of ["partner", "request"] as const) {
      const snapshot = {
        ok: true as const,
        navigation: DEFAULT_SITE_NAVIGATION,
        modules: { ...DEFAULT_SITE_MODULES, transfersMode },
      };
      expect(evaluatePublicModuleAccess(snapshot, "transfers", "public_read")).toEqual({
        allowed: true,
      });
    }
  });
});
