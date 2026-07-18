import { describe, expect, it } from "vitest";
import {
  createPageBuilderBlock,
  PAGE_BUILDER_BLOCKS,
} from "@/lib/cms/page-builder/block-registry";
import {
  normalizeBlogBodyBlock,
  normalizeBlogBodyBlocks,
  parseCmsBlogSection,
  parseCmsGuideSection,
} from "@/lib/cms/page-builder/block-normalize";

describe("page-builder block registry", () => {
  it("creates default blocks for every slug", () => {
    for (const def of PAGE_BUILDER_BLOCKS) {
      const block = createPageBuilderBlock(def.slug);
      expect(block.type).toBe(def.slug);
    }
  });
});

describe("block normalize", () => {
  it("round-trips callout block", () => {
    const raw = { type: "callout", variant: "tip", title: "Совет", body: "Текст" };
    expect(normalizeBlogBodyBlock(raw)).toEqual(raw);
  });

  it("parses cms blog section with blocks", () => {
    const section = parseCmsBlogSection({
      title: "FAQ",
      body: "",
      blockType: "faq",
      blocks: [{ type: "faq", items: [{ question: "Q?", answer: "A." }] }],
    });
    expect(section.blockType).toBe("faq");
    expect(section.blocks).toHaveLength(1);
  });

  it("parses cms guide section with heading and blocks", () => {
    const section = parseCmsGuideSection({
      heading: "Сезоны",
      html: "<p>Текст</p>",
      blockType: "checklist",
      blocks: [{ type: "paragraph", text: "Абзац" }],
      list: ["Пункт"],
    });
    expect(section.heading).toBe("Сезоны");
    expect(section.html).toBe("<p>Текст</p>");
    expect(section.blockType).toBe("checklist");
    expect(section.blocks).toHaveLength(1);
    expect(section.list).toEqual(["Пункт"]);
  });

  it("filters invalid blocks", () => {
    const blocks = normalizeBlogBodyBlocks([
      { type: "paragraph", text: "ok" },
      { type: "unknown" },
      null,
    ]);
    expect(blocks).toHaveLength(1);
  });

  it("normalizes reusable editorial blocks", () => {
    expect(
      normalizeBlogBodyBlock({
        type: "image-text",
        src: "/media/patagonia.jpg",
        alt: "Горы Патагонии",
        title: "Дорога на юг",
        body: "Пейзаж меняется с каждым километром.",
        imagePosition: "right",
      })
    ).toMatchObject({
      type: "image-text",
      src: "/media/patagonia.jpg",
      imagePosition: "right",
    });

    expect(
      normalizeBlogBodyBlock({
        type: "author-card",
        name: "Анна",
        role: "Автор путеводителя",
        bio: "Живёт в Аргентине.",
        avatarSrc: "https://images.example/anna.jpg",
      })
    ).toEqual({
      type: "author-card",
      name: "Анна",
      role: "Автор путеводителя",
      bio: "Живёт в Аргентине.",
      avatarSrc: "https://images.example/anna.jpg",
      avatarAlt: undefined,
      href: undefined,
      linkLabel: undefined,
    });

    expect(
      normalizeBlogBodyBlock({
        type: "facts-grid",
        title: "Главное",
        columns: 4,
        items: [{ label: "Сезон", value: "Октябрь — апрель", description: "Теплее" }],
      })
    ).toMatchObject({ type: "facts-grid", columns: 4 });

    expect(
      normalizeBlogBodyBlock({
        type: "quote",
        text: "Аргентина раскрывается в дороге.",
        author: "Редакция",
      })
    ).toEqual({
      type: "quote",
      text: "Аргентина раскрывается в дороге.",
      author: "Редакция",
      context: undefined,
    });
  });

  it("uses safe layout defaults for malformed editorial blocks", () => {
    expect(
      normalizeBlogBodyBlock({ type: "image-text", imagePosition: "center" })
    ).toMatchObject({ imagePosition: "left" });
    expect(
      normalizeBlogBodyBlock({ type: "facts-grid", columns: 12, items: "invalid" })
    ).toMatchObject({ columns: 3, items: [] });
  });
});
