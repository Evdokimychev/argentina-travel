import { describe, expect, it } from "vitest";

import {
  getKbMinimumWordCount,
  getPublicationIssues,
  getStrictPublicationIssues,
  isPublicKbEntry,
  isStrictPublicationReady,
} from "./publication-quality";
import type { KbEntry } from "./types";

const validEntry: KbEntry = {
  id: "ushuaia",
  type: "city",
  title: "Ушуайя",
  summary: "Город на Огненной Земле и отправная точка для поездок по региону.",
  status: "published",
  site_ready: true,
  media: { hero: { url: "/images/ushuaia.jpg" } },
  sources: [{ title: "Официальный источник", url: "https://example.com" }],
  editorial: { word_count: 520 },
  body: "Полезное описание города с практической логистикой.",
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

  it("does not confuse the Spanish greeting Todo bien with an editorial TODO", () => {
    const entry = {
      ...validEntry,
      body: "При встрече часто спрашивают: ¿Todo bien?",
    };
    expect(getPublicationIssues(entry)).not.toContain("placeholder_content");
    expect(isPublicKbEntry(entry)).toBe(true);
  });

  it("allows user-facing advice to disable browser auto-translation", () => {
    const entry = {
      ...validEntry,
      body: "Если форма работает странно, откройте страницу без автоперевода браузера.",
    };
    expect(getPublicationIssues(entry)).not.toContain("machine_translation_marker");
    expect(isPublicKbEntry(entry)).toBe(true);
  });

  it.each([
    [{ site_ready: false }, "not_publication_ready"],
    [{ status: "archived" }, "not_publication_ready"],
    [{ title: "LatiСевероmérica" }, "mixed_script_word"],
    [{ title: "Bird watching in Santa Cruz" }, "non_russian_title"],
    [{ summary: "Visita la Patagonia Argentina y descubre sus paisajes naturales." }, "non_russian_summary"],
    [{ summary: "TODO placeholder" }, "placeholder_content"],
    [{ body: "Текст. Автоперевод требует редакторской вычитки." }, "machine_translation_marker"],
    [{ body: "## Рекомендации\n\nСм. `recommendations` в метаданных." }, "internal_editorial_marker"],
    [{ body: "## Описание Текст статьи. ## Источники - Источник." }, "malformed_markdown_heading"],
    [{ sources: [] }, "missing_source"],
    [{ sources: [{ title: "Внутренняя заметка", url: "" }] }, "missing_source"],
    [{ editorial: { word_count: 520, review_due: true } }, "verification_due"],
  ] as const)("quarantines critical issue %s", (overrides, issue) => {
    const entry = { ...validEntry, ...overrides } as KbEntry;
    expect(getPublicationIssues(entry)).toContain(issue);
    expect(isPublicKbEntry(entry)).toBe(false);
  });

  it("keeps a complete archive tombstone outside publication without quality debt", () => {
    const entry: KbEntry = {
      ...validEntry,
      status: "archived",
      site_ready: false,
      redirect_to: "canonical-guide",
      archive_reason: "Содержимое объединено с каноническим руководством.",
    };

    expect(getPublicationIssues(entry)).toEqual([]);
    expect(isPublicKbEntry(entry)).toBe(false);
  });

  it("requires explicit authorship for a personal story", () => {
    const story: KbEntry = {
      ...validEntry,
      type: "author_tip",
      media: null,
      sources: [],
      editorial: { word_count: 300 },
      personal_experience: true,
      verified_by_ivan: false,
    };

    expect(getPublicationIssues(story)).toEqual(
      expect.arrayContaining(["unverified_personal_authorship", "missing_author"]),
    );
    expect(
      isPublicKbEntry({
        ...story,
        verified_by_ivan: true,
        author_name: "Иван",
      }),
    ).toBe(true);
  });

  it.each([
    [{ editorial: { word_count: 40 } }, "thin_content"],
    [{ media: null }, "missing_hero"],
  ] as const)("quarantines incomplete public content %s", (overrides, issue) => {
    const entry = { ...validEntry, ...overrides } as KbEntry;
    expect(getPublicationIssues(entry)).toContain(issue);
    expect(isPublicKbEntry(entry)).toBe(false);
  });

  it("uses a substantial threshold for guides while preserving concise FAQ answers", () => {
    const guide = {
      ...validEntry,
      type: "guide" as const,
      media: null,
      editorial: { word_count: 599 },
    };
    const faq = {
      ...validEntry,
      type: "faq" as const,
      media: null,
      editorial: { word_count: 120 },
    };

    expect(getKbMinimumWordCount(guide)).toBe(600);
    expect(getPublicationIssues(guide)).toContain("thin_content");
    expect(getPublicationIssues(faq)).not.toContain("thin_content");
  });

  it("keeps the existing corpus public in diagnostic provenance mode", () => {
    const entry: KbEntry = {
      ...validEntry,
      editorial: {
        sensitive: true,
        word_count: 600,
        provenance: {
          schema_version: 1,
          applicable: true,
          declared: false,
          mode: "diagnostic",
          strict_ready: false,
          issue_count: 1,
          issue_codes: ["missing_sensitive_claim_mapping"],
          source_count: 1,
          identified_source_count: 0,
          claim_count: 0,
          sensitive_claim_count: 0,
          stale_after_days: 45,
        },
      },
    };

    expect(isPublicKbEntry(entry)).toBe(true);
    expect(getStrictPublicationIssues(entry)).toContain("sensitive_provenance_not_ready");
    expect(isStrictPublicationReady(entry)).toBe(false);
  });

  it("fails closed when a sensitive entry opts into strict provenance", () => {
    const entry: KbEntry = {
      ...validEntry,
      provenance: { schema_version: 1, mode: "strict", stale_after_days: 45 },
      editorial: {
        sensitive: true,
        word_count: 600,
        provenance: {
          schema_version: 1,
          applicable: true,
          declared: true,
          mode: "strict",
          strict_ready: false,
          issue_count: 1,
          issue_codes: ["sensitive_claim_without_primary_source"],
          source_count: 1,
          identified_source_count: 1,
          claim_count: 1,
          sensitive_claim_count: 1,
          stale_after_days: 45,
        },
      },
    };

    expect(getPublicationIssues(entry)).toContain("sensitive_provenance_not_ready");
    expect(isPublicKbEntry(entry)).toBe(false);
  });

  it("accepts a sensitive entry with complete strict provenance", () => {
    const entry: KbEntry = {
      ...validEntry,
      provenance: { schema_version: 1, mode: "strict", stale_after_days: 45 },
      editorial: {
        sensitive: true,
        word_count: 600,
        provenance: {
          schema_version: 1,
          applicable: true,
          declared: true,
          mode: "strict",
          strict_ready: true,
          issue_count: 0,
          issue_codes: [],
          source_count: 1,
          identified_source_count: 1,
          claim_count: 1,
          sensitive_claim_count: 1,
          stale_after_days: 45,
        },
      },
    };

    expect(isPublicKbEntry(entry)).toBe(true);
    expect(isStrictPublicationReady(entry)).toBe(true);
  });
});
