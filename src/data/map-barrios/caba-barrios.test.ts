import { describe, expect, it } from "vitest";
import {
  CABA_BARRIOS,
  CABA_RECOMMENDED_COUNT,
  enrichBarrioProperties,
  matchCabaBarrio,
} from "@/data/map-barrios/caba-barrios";

describe("caba-barrios", () => {
  it("registry has 48 official barrios", () => {
    expect(CABA_BARRIOS).toHaveLength(48);
  });

  it("matches OSM names to registry", () => {
    expect(matchCabaBarrio("Palermo")?.slug).toBe("palermo");
    expect(matchCabaBarrio("San Nicolás")?.slug).toBe("san-nicolas");
    expect(matchCabaBarrio("Villa Crespo")?.slug).toBe("villa-crespo");
    expect(matchCabaBarrio("Unknown Place")).toBeNull();
  });

  it("enriches barrio properties with Russian labels", () => {
    const enriched = enrichBarrioProperties({
      slug: "palermo",
      name: "Palermo",
    });
    expect(enriched.nameRu).toBe("Палермо");
    expect(enriched.recommendedForStay).toBe(true);
    expect(String(enriched.description).length).toBeGreaterThan(20);
    expect(enriched.audienceLabel).toContain("туристам");
  });

  it("counts recommended barrios", () => {
    expect(CABA_RECOMMENDED_COUNT).toBe(13);
  });
});
