import { describe, expect, it } from "vitest";
import { searchSiteIndex } from "@/lib/site-search";

describe("searchSiteIndex", () => {
  it("keeps matching places in grouped search results", () => {
    const groups = searchSiteIndex(
      [
        {
          id: "place-iguazu",
          type: "place",
          title: "Водопады Игуасу",
          href: "/places/iguazu-falls",
        },
      ],
      "Игуасу"
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.type).toBe("place");
    expect(groups[0]?.items[0]?.href).toBe("/places/iguazu-falls");
  });
});
