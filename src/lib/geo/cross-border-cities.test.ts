import { describe, expect, it } from "vitest";
import {
  inferCountryFromLocationName,
  resolveTourCountryLabel,
} from "@/lib/geo/cross-border-cities";
import { formatTourLocationCompactPlain } from "@/lib/geo/format";

describe("cross-border geography normalization", () => {
  it("maps São Paulo to Brazil", () => {
    expect(inferCountryFromLocationName("São Paulo")).toEqual({
      countryRu: "Бразилия",
      countryCode: "BR",
    });
    expect(resolveTourCountryLabel({ destination: "São Paulo" })).toBe("Бразилия");
    expect(formatTourLocationCompactPlain({ destination: "São Paulo" })).toBe(
      "São Paulo, Бразилия",
    );
  });

  it("maps Foz do Iguaçu to Brazil", () => {
    expect(inferCountryFromLocationName("Foz do Iguaçu")).toEqual({
      countryRu: "Бразилия",
      countryCode: "BR",
    });
    expect(formatTourLocationCompactPlain({ destination: "Foz do Iguaçu" })).toBe(
      "Foz do Iguaçu, Бразилия",
    );
  });

  it("keeps Buenos Aires in Argentina", () => {
    expect(resolveTourCountryLabel({ destination: "Buenos Aires" })).toBe("Аргентина");
    expect(formatTourLocationCompactPlain({ destination: "Buenos Aires" })).toBe(
      "Буэнос-Айрес, Аргентина",
    );
  });

  it("respects explicit country over inferred default", () => {
    expect(
      formatTourLocationCompactPlain({
        destination: "Puerto Iguazu",
        country: "Аргентина",
      }),
    ).toBe("Пуэрто-Игуасу, Аргентина");
  });
});
