import { describe, expect, it } from "vitest";
import {
  buildYouTravelImportantToKnowItems,
  normalizeYouTravelImportantToKnowHtml,
  resolveYouTravelImportantToKnowItems,
} from "@/lib/youtravel/important-to-know";
import type { YouTravelTour } from "@/lib/youtravel/types";

describe("YouTravel important to know", () => {
  it("builds default accordion blocks with visa info from partner API", () => {
    const items = buildYouTravelImportantToKnowItems({
      visa_info: "<p>Аргентина и Чили</p><p>Гражданам России визы не нужны</p>",
    } satisfies YouTravelTour);

    expect(items.map((item) => item.title)).toEqual([
      "Условия отмены",
      "Визы",
      "Нужно ли предоплачивать тур полностью?",
      "Как забронировать",
    ]);
    expect(items[1]?.html).toContain("Гражданам России визы не нужны");
    expect(items[0]?.html).toContain("24 часов");
  });

  it("prefers scraped items when the public page returned a full block", () => {
    const items = resolveYouTravelImportantToKnowItems({
      visa_info: "<p>Fallback visa</p>",
      public_page_extras: {
        importantToKnowItems: [
          { title: "Условия отмены", html: "<p>Особые условия.</p>" },
          { title: "Визы", html: "<p>Аргентина</p>" },
          { title: "Как забронировать", html: "<p>Через платформу.</p>" },
        ],
      },
    } satisfies YouTravelTour);

    expect(items).toHaveLength(3);
    expect(items?.[0]?.html).toContain("Особые условия");
  });

  it("merges scraped partial data with platform defaults", () => {
    const items = resolveYouTravelImportantToKnowItems({
      public_page_extras: {
        importantToKnowItems: [{ title: "Визы", html: "<p>Только Аргентина</p>" }],
      },
    } satisfies YouTravelTour);

    expect(items?.map((item) => item.title)).toEqual([
      "Визы",
      "Условия отмены",
      "Нужно ли предоплачивать тур полностью?",
      "Как забронировать",
    ]);
  });

  it("normalizes YouTravel clickable spans and plain text bodies", () => {
    expect(
      normalizeYouTravelImportantToKnowHtml(
        'Текст <!--[--><span class="cl-green-default clickable">забронировать</span><!--]--> дальше',
      ),
    ).toContain('<strong class="text-brand">забронировать</strong>');

    expect(normalizeYouTravelImportantToKnowHtml("Простой текст")).toBe("<p>Простой текст</p>");
  });
});
