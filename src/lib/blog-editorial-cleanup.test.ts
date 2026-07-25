import { describe, expect, it } from "vitest";
import { cleanLegacyBlogSourceMarkers } from "@/lib/blog-editorial-cleanup";
import { parseBlogSectionBody } from "@/lib/blog-section-body";
import { linkifyBlogText } from "@/lib/blog-internal-links";

describe("cleanLegacyBlogSourceMarkers", () => {
  it("still removes bare parenthetical source names", () => {
    expect(cleanLegacyBlogSourceMarkers("Факт о городе (Tripadvisor).")).toBe("Факт о городе.");
  });

  it("preserves editor markdown links including short official URLs", () => {
    const input =
      "* [Туристический портал Буэнос-Айреса — климат](https://turismo.buenosaires.gob.ar/en/article/climate)\n* [SMN](https://repositorio.smn.gob.ar/handle/20.500.12160/2506)";
    const cleaned = cleanLegacyBlogSourceMarkers(input);
    expect(cleaned).toContain("](https://turismo.buenosaires.gob.ar/en/article/climate)");
    expect(cleaned).toContain("](https://repositorio.smn.gob.ar/handle/20.500.12160/2506)");
  });

  it("preserves relative internal markdown links", () => {
    const cleaned = cleanLegacyBlogSourceMarkers(
      "См. [винный гид](/blog/mendoza-vinnyj-gid).",
    );
    expect(cleaned).toContain("](/blog/mendoza-vinnyj-gid)");
  });
});

describe("sources section parsing for editable articles", () => {
  it("keeps source URLs through parse + linkify", () => {
    const body =
      "Проверено 25.07.2026.\n\n* [Туристический портал Буэнос-Айреса — климат](https://turismo.buenosaires.gob.ar/en/article/climate)\n* [Официальный туризм Мар-дель-Платы](https://www.turismomardelplata.gob.ar/)";
    const blocks = parseBlogSectionBody(body);
    const bullets = blocks.find((block) => block.type === "bullets");
    expect(bullets?.type).toBe("bullets");
    if (bullets?.type !== "bullets") return;

    expect(bullets.items[0]).toContain("](https://turismo.buenosaires.gob.ar");
    const segments = linkifyBlogText(bullets.items[0]);
    expect(segments.some((segment) => segment.type === "link" && segment.href.startsWith("https://"))).toBe(
      true,
    );
    expect(
      segments.some(
        (segment) => segment.type === "link" && segment.href === "/destinations/ba",
      ),
    ).toBe(false);
  });
});
