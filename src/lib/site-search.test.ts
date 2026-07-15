import { describe, expect, it } from "vitest";

import { searchSiteIndex } from "./site-search";
import type { SearchIndexItem } from "./site-search-index";

const items: SearchIndexItem[] = [
  {
    id: "place-iguazu",
    type: "place",
    title: "Водопады Игуасу",
    href: "/places/iguazu",
    keywords: ["Iguazú"],
  },
  {
    id: "knowledge-ushuaia",
    type: "knowledge",
    title: "Ушуайя",
    href: "/baza-znaniy/ushuaia",
    keywords: ["Ushuaia", "Огненная Земля"],
  },
  {
    id: "place-unrelated",
    type: "place",
    title: "Ла-Риоха",
    href: "/places/la-rioja",
    description: "Маршрут через сухую долину и горные ущелья региона.",
  },
];

describe("static site search", () => {
  it("keeps place results in the grouped fallback", () => {
    expect(searchSiteIndex(items, "игуасу")[0]).toMatchObject({ type: "place" });
  });

  it("matches Spanish aliases without diacritics", () => {
    expect(searchSiteIndex(items, "Iguazu")[0]?.items[0]?.id).toBe("place-iguazu");
  });

  it("matches a small typo in a knowledge-base alias", () => {
    expect(searchSiteIndex(items, "Ushuia")[0]?.type).toBe("knowledge");
  });

  it("drops a lone fuzzy coincidence from an unrelated long description", () => {
    const results = searchSiteIndex(items, "Ушуая");
    expect(results.flatMap((group) => group.items).map((item) => item.id)).not.toContain(
      "place-unrelated"
    );
  });
});
