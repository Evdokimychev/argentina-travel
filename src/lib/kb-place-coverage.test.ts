import { describe, expect, it } from "vitest";

import { PLACE_TO_KB_ID } from "@/data/kb-place-id-map";
import { PLACES_KB_IMPORT } from "@/data/places-kb-import.generated";
import { getAllPlaceListings } from "@/data/places-seed";
import { getAllEntryIds } from "@/lib/knowledge-base/content";

const EXPECTED_UNMAPPED = [
  "cementerio-de-la-chacarita",
  "cerro-de-los-7-colores",
  "fitz-roy",
  "lujan-de-cuyo",
  "maipu",
  "pilar",
  "potrerillos",
  "quebrada-de-las-conchas",
  "trelew",
  "trevelin",
  "zarate",
] as const;

describe("places ↔ public knowledge base coverage", () => {
  it("keeps every generated KB place connected to its exact source entry", () => {
    for (const place of PLACES_KB_IMPORT) {
      expect(PLACE_TO_KB_ID[place.slug], place.slug).toBe(place.kbSlug);
    }
  });

  it("keeps a useful public overlay without bypassing publication quarantine", () => {
    const places = getAllPlaceListings();
    const placeSlugs = new Set(places.map((place) => place.slug));
    const publicKbIds = new Set(getAllEntryIds());

    const mappedSlugs = Object.keys(PLACE_TO_KB_ID);
    const publicOverlayCount = places.filter((place) => {
      const kbId = PLACE_TO_KB_ID[place.slug];
      return kbId ? publicKbIds.has(kbId) : false;
    }).length;
    const unmapped = places
      .filter((place) => !PLACE_TO_KB_ID[place.slug])
      .map((place) => place.slug)
      .sort();

    expect(places).toHaveLength(104);
    expect(publicOverlayCount).toBeGreaterThanOrEqual(20);
    expect(unmapped).toEqual([...EXPECTED_UNMAPPED].sort());
    for (const slug of mappedSlugs) {
      expect(placeSlugs.has(slug), slug).toBe(true);
    }
  });
});
