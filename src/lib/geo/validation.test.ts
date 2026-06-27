import { describe, expect, it } from "vitest";
import {
  formatTourLocationCompactPlain,
  resolveTourPrimaryLocation,
  validateTourLocation,
} from "@/lib/geo";

describe("geo validation", () => {
  it("flags Buenos Aires with Brazil country", () => {
    const warnings = validateTourLocation({
      destination: "Buenos Aires",
      country: "Бразилия",
    });
    expect(warnings.some((w) => w.code === "ba-not-brazil")).toBe(true);
  });

  it("flags Bariloche with Chile country", () => {
    const warnings = validateTourLocation({
      destination: "Bariloche",
      country: "Чили",
    });
    expect(warnings.some((w) => w.code === "bariloche-not-chile")).toBe(true);
  });

  it("flags Iguazu under Patagonia macro region", () => {
    const warnings = validateTourLocation({
      destination: "Puerto Iguazu",
      region: "Patagonia",
    });
    expect(warnings.some((w) => w.code === "iguazu-not-patagonia")).toBe(true);
  });

  it("flags Brazil tour displayed as Argentina", () => {
    const warnings = validateTourLocation({
      destination: "Argentina",
      country: "Brazil",
    });
    expect(warnings.some((w) => w.code === "brazil-tour-argentina-display")).toBe(true);
  });

  it("flags Patagonia region with BA destination", () => {
    const warnings = validateTourLocation({
      destination: "Buenos Aires",
      region: "Patagonia",
    });
    expect(warnings.some((w) => w.code === "patagonia-region-ba-destination")).toBe(true);
  });
});

describe("resolveTourPrimaryLocation", () => {
  it("prefers Patagonia macro for multi-city patagonia tours", () => {
    const result = resolveTourPrimaryLocation({
      destination: "Buenos Aires",
      region: "Patagonia",
      cities: ["Bariloche", "El Calafate"],
      title: "Патагония: ледники и озёра",
    });
    expect(result.primary).toBe("Патагония");
    expect(result.locationCount).toBeGreaterThanOrEqual(2);
  });

  it("formats compact multi-location label", () => {
    const label = formatTourLocationCompactPlain({
      region: "Patagonia",
      cities: ["Bariloche", "El Calafate", "Ushuaia"],
    });
    expect(label).toMatch(/Патагония · 3 локации/);
  });
});
