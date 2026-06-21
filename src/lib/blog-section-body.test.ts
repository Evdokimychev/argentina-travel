import { describe, expect, it } from "vitest";
import {
  getBlogSectionKind,
  parseBlogSectionBody,
  CALLOUT_LABELS,
} from "@/lib/blog-section-body";

describe("getBlogSectionKind", () => {
  it("detects FAQ from title", () => {
    expect(getBlogSectionKind("FAQ")).toBe("faq");
    expect(getBlogSectionKind("Часто задаваемые вопросы")).toBe("faq");
  });

  it("respects explicit blockType over title", () => {
    expect(getBlogSectionKind("Введение", "faq")).toBe("faq");
    expect(getBlogSectionKind("FAQ", "default")).toBe("default");
  });

  it("uses blockType checklist for section parsing", () => {
    const kind = getBlogSectionKind("Документы", "checklist");
    expect(kind).toBe("checklist");
  });
});

describe("parseBlogSectionBody — paragraphs", () => {
  it("parses a single paragraph", () => {
    const blocks = parseBlogSectionBody("Один абзац текста.");
    expect(blocks).toEqual([{ type: "paragraph", text: "Один абзац текста." }]);
  });

  it("collapses internal newlines in paragraphs", () => {
    const blocks = parseBlogSectionBody("Строка один\nСтрока два");
    expect(blocks[0]).toEqual({ type: "paragraph", text: "Строка один Строка два" });
  });

  it("splits double-newline blocks into multiple paragraphs", () => {
    const blocks = parseBlogSectionBody("Первый.\n\nВторой.");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[1].type).toBe("paragraph");
  });
});

describe("parseBlogSectionBody — callouts", () => {
  it("parses markdown callout syntax", () => {
    const blocks = parseBlogSectionBody("> [!tip] Лайфхак\nСовет по поездке.");
    expect(blocks[0]).toMatchObject({
      type: "callout",
      variant: "tip",
      body: "Совет по поездке.",
    });
  });

  it("parses bold Совет marker", () => {
    const blocks = parseBlogSectionBody("**Совет:** бронируйте заранее.");
    expect(blocks[0]).toMatchObject({
      type: "callout",
      variant: "tip",
      title: "Совет",
      body: "бронируйте заранее.",
    });
  });

  it("parses bold Важно marker", () => {
    const blocks = parseBlogSectionBody("**Важно:** проверьте визу.");
    expect(blocks[0]).toMatchObject({ type: "callout", variant: "important" });
  });

  it("parses Бюджет as know callout", () => {
    const blocks = parseBlogSectionBody("**Бюджет:** 80–120 USD на день.");
    expect(blocks[0]).toMatchObject({
      type: "callout",
      variant: "know",
      title: "Бюджет",
    });
  });

  it("parses Сезон as know callout", () => {
    const blocks = parseBlogSectionBody("**Сезон:** ноябрь – март.");
    expect(blocks[0]).toMatchObject({
      type: "callout",
      variant: "know",
      title: "Сезон",
    });
  });

  it("parses markdown callout on single line", () => {
    const blocks = parseBlogSectionBody("> [!important] Срочно");
    expect(blocks[0]).toMatchObject({ type: "callout", variant: "important" });
  });

  it("parses bold Лайфхак marker", () => {
    const blocks = parseBlogSectionBody("**Лайфхак:** купите eSIM до вылета.");
    expect(blocks[0]).toMatchObject({ type: "callout", variant: "hack" });
  });
});

describe("parseBlogSectionBody — lists", () => {
  it("parses bullet list", () => {
    const blocks = parseBlogSectionBody("* Пункт один\n* Пункт два");
    expect(blocks[0]).toEqual({
      type: "bullets",
      items: ["Пункт один", "Пункт два"],
    });
  });

  it("parses hyphen bullets", () => {
    const blocks = parseBlogSectionBody("- А\n- Б");
    expect(blocks[0].type).toBe("bullets");
  });

  it("parses numbered steps", () => {
    const blocks = parseBlogSectionBody("1. Шаг один\n2. Шаг два");
    expect(blocks[0]).toEqual({ type: "steps", items: ["Шаг один", "Шаг два"] });
  });

  it("parses checklist with checkbox", () => {
    const blocks = parseBlogSectionBody("□ Паспорт\n□ Страховка");
    expect(blocks[0]).toMatchObject({
      type: "checklist",
      items: [{ text: "Паспорт" }, { text: "Страховка" }],
    });
  });

  it("parses negative checklist lines", () => {
    const blocks = parseBlogSectionBody("❌ Не брать зонт");
    expect(blocks[0]).toMatchObject({
      type: "checklist",
      items: [{ text: "Не брать зонт", negative: true }],
    });
  });

  it("merges adjacent bullet blocks", () => {
    const blocks = parseBlogSectionBody("* А\n\n* Б");
    expect(blocks).toHaveLength(1);
    if (blocks[0].type === "bullets") {
      expect(blocks[0].items).toEqual(["А", "Б"]);
    }
  });
});

describe("parseBlogSectionBody — tables", () => {
  it("parses tab-separated table", () => {
    const blocks = parseBlogSectionBody("Колонка A\tКолонка B\nЯчейка 1\tЯчейка 2");
    expect(blocks[0]).toEqual({
      type: "table",
      headers: ["Колонка A", "Колонка B"],
      rows: [["Ячейка 1", "Ячейка 2"]],
    });
  });
});

describe("parseBlogSectionBody — subheadings", () => {
  it("detects short line as subheading", () => {
    const blocks = parseBlogSectionBody("Плюсы");
    expect(blocks[0]).toEqual({ type: "subheading", text: "Плюсы" });
  });

  it("does not treat long lines as subheadings", () => {
    const long = "А".repeat(80);
    const blocks = parseBlogSectionBody(long);
    expect(blocks[0].type).toBe("paragraph");
  });
});

describe("parseBlogSectionBody — FAQ sections", () => {
  it("extracts FAQ from section title", () => {
    const blocks = parseBlogSectionBody(
      "Стоит ли ехать зимой? Да, если интересны лыжи.",
      "FAQ",
    );
    expect(blocks[0].type).toBe("faq");
    if (blocks[0].type === "faq") {
      expect(blocks[0].items[0].question).toContain("?");
    }
  });

  it("uses blockType faq without FAQ title", () => {
    const blocks = parseBlogSectionBody(
      "Когда лучше? Весной.",
      "Дополнительно",
      "faq",
    );
    expect(blocks[0].type).toBe("faq");
  });
});

describe("parseBlogSectionBody — mistakes sections", () => {
  it("pairs subheading + explanation as mistake callouts", () => {
    const blocks = parseBlogSectionBody(
      "Бронировать в последний момент\n\nЖильё разбирают за 2–3 месяца.",
      "Типичные ошибки",
    );
    expect(blocks[0]).toMatchObject({
      type: "callout",
      variant: "mistake",
      title: "Бронировать в последний момент",
    });
  });
});

describe("parseBlogSectionBody — edge cases", () => {
  it("returns empty for empty body", () => {
    expect(parseBlogSectionBody("")).toEqual([]);
    expect(parseBlogSectionBody("   \n\n  ")).toEqual([]);
  });

  it("handles triple newlines as block separators", () => {
    const blocks = parseBlogSectionBody("А\n\n\nБ");
    expect(blocks).toHaveLength(2);
  });

  it("exports CALLOUT_LABELS for UI", () => {
    expect(CALLOUT_LABELS.tip).toBe("Совет");
    expect(CALLOUT_LABELS.know).toBe("Что нужно знать");
  });
});
