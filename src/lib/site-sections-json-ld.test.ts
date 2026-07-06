import { describe, expect, it } from "vitest";
import {
  buildHomePrimarySectionsItemListJsonLd,
  getHomePrimarySectionLinks,
  YANDEX_PRIORITY_HUB_PATHS,
} from "@/lib/site-sections-json-ld";

describe("site-sections-json-ld", () => {
  it("lists primary nav hubs plus FAQ", () => {
    const links = getHomePrimarySectionLinks();
    const paths = links.map((link) => link.path);
    expect(paths).toContain("/tours");
    expect(paths).toContain("/excursions");
    expect(paths).toContain("/guide");
    expect(paths).toContain("/immigration");
    expect(paths).toContain("/blog");
    expect(paths).toContain("/faq");
    expect(links.every((link) => link.name.length >= 4)).toBe(true);
  });

  it("builds homepage ItemList with absolute WebPage urls", () => {
    const jsonLd = buildHomePrimarySectionsItemListJsonLd("Пора в Аргентину");
    expect(jsonLd["@type"]).toBe("ItemList");
    const serialized = JSON.stringify(jsonLd);
    expect(serialized).toContain('"@type":"WebPage"');
    expect(serialized).toContain("https://");
    expect(serialized).toContain("/tours");
  });

  it("defines Yandex priority hub paths for sitemap", () => {
    expect(YANDEX_PRIORITY_HUB_PATHS).toContain("/faq");
    expect(YANDEX_PRIORITY_HUB_PATHS).toContain("/guide");
  });
});
