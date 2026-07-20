import { describe, expect, it } from "vitest";
import { formatMapObjectListSubtitle } from "@/lib/map-types";

describe("formatMapObjectListSubtitle", () => {
  it("does not repeat a region used as fallback metadata", () => {
    expect(
      formatMapObjectListSubtitle({
        region: "Патагония",
        meta: "Патагония",
        kind: "national_park",
      }),
    ).toBe("Патагония");
  });

  it("keeps a useful city or source label", () => {
    expect(
      formatMapObjectListSubtitle({ region: "Куйо", meta: "Mendoza", kind: "city" }),
    ).toBe("Куйо · Mendoza");
  });
});
