import { describe, expect, it } from "vitest";

import {
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

  it("keeps the existing corpus public in diagnostic provenance mode", () => {
    const entry: KbEntry = {
      ...validEntry,
      editorial: {
        sensitive: true,
        word_count: 180,
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
        word_count: 180,
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
        word_count: 180,
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
