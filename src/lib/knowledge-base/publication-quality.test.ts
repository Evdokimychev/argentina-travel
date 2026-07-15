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
  editorial: {
    sensitive: false,
    review_due: false,
    missing_sources: false,
    missing_primary_source: false,
    missing_reviewer: false,
    missing_media_rights: false,
  },
  body: "Полезное описание.",
};

describe("KB publication quarantine", () => {
  it("allows reviewed Russian content", () => {
    expect(isPublicKbEntry(validEntry)).toBe(true);
  });

  it.each([
    [{ site_ready: false }, "not_publication_ready"],
    [{ title: "LatiСевероmérica" }, "mixed_script_word"],
    [{ body: "Небрежно смешанное agresивно слово." }, "mixed_script_body"],
    [{ title: "Bird watching in Santa Cruz" }, "non_russian_title"],
    [{ title: "Национальный парк Los Cardones" }, "mixed_script_title"],
    [{ summary: "Visita la Patagonia Argentina y descubre sus paisajes naturales." }, "non_russian_summary"],
    [
      {
        body:
          "Este párrafo conserva una traducción completa en español y no debe publicarse en una página rusa porque todavía necesita una revisión editorial humana antes de mostrarse.",
      },
      "non_russian_body",
    ],
    [{ summary: "TODO placeholder" }, "placeholder_content"],
    [
      { body: "Источник переведён автоматически и требует редакторской вычитки." },
      "editorial_artifact",
    ],
    [{ body: "Автоперевод 2026-07-07." }, "editorial_artifact"],
    [{ editorial: { word_count: 42 } }, "thin_content"],
    [{ confidence: "low" }, "low_confidence"],
    [{ editorial: { sensitive: true, missing_primary_source: true } }, "missing_primary_source"],
    [{ editorial: { sensitive: true, missing_reviewer: true } }, "missing_sensitive_reviewer"],
    [{ editorial: { review_due: true } }, "verification_due"],
    [{ editorial: { missing_media_rights: true } }, "missing_media_rights"],
  ] as const)("quarantines critical issue %s", (overrides, issue) => {
    const entry = { ...validEntry, ...overrides };
    expect(getPublicationIssues(entry)).toContain(issue);
    expect(isPublicKbEntry(entry)).toBe(false);
  });
});
