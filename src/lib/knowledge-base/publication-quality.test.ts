import { describe, expect, it } from "vitest";

import { getPublicationIssues, isPublicKbEntry } from "./publication-quality";
import type { KbEntry } from "./types";

const validEntry: KbEntry = {
  id: "ushuaia",
  type: "city",
  title: "Ушуайя",
  summary: "Город на Огненной Земле и отправная точка для поездок по региону.",
  status: "published",
  site_ready: true,
  media: { hero: { url: "/images/ushuaia.jpg" } },
  editorial: { word_count: 180 },
  body: "Полезное описание.",
};

describe("KB publication quarantine", () => {
  it("allows reviewed Russian content", () => {
    expect(isPublicKbEntry(validEntry)).toBe(true);
  });

  it("allows readable compounds with a Latin abbreviation or brand", () => {
    const entry = {
      ...validEntry,
      body: "Для оплаты подойдёт QR-код, а для поездки — Uber-аналог.",
    };
    expect(getPublicationIssues(entry)).not.toContain("mixed_script_word");
    expect(isPublicKbEntry(entry)).toBe(true);
  });

  it.each([
    [{ site_ready: false }, "not_publication_ready"],
    [{ title: "LatiСевероmérica" }, "mixed_script_word"],
    [{ title: "Bird watching in Santa Cruz" }, "non_russian_title"],
    [{ summary: "Visita la Patagonia Argentina y descubre sus paisajes naturales." }, "non_russian_summary"],
    [{ summary: "TODO placeholder" }, "placeholder_content"],
    [{ body: "Текст. Автоперевод требует редакторской вычитки." }, "machine_translation_marker"],
    [{ body: "## Рекомендации\n\nСм. `recommendations` в метаданных." }, "internal_editorial_marker"],
    [{ body: "## Описание Текст статьи. ## Источники - Источник." }, "malformed_markdown_heading"],
  ] as const)("quarantines critical issue %s", (overrides, issue) => {
    const entry = { ...validEntry, ...overrides };
    expect(getPublicationIssues(entry)).toContain(issue);
    expect(isPublicKbEntry(entry)).toBe(false);
  });

  it.each([
    [{ editorial: { word_count: 40 } }, "thin_content"],
    [{ media: null }, "missing_hero"],
  ] as const)("quarantines incomplete public content %s", (overrides, issue) => {
    const entry = { ...validEntry, ...overrides } as KbEntry;
    expect(getPublicationIssues(entry)).toContain(issue);
    expect(isPublicKbEntry(entry)).toBe(false);
  });
});
