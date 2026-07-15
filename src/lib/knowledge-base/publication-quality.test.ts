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
    [{ title: "Bird watching in Santa Cruz" }, "non_russian_title"],
    [{ summary: "Visita la Patagonia Argentina y descubre sus paisajes naturales." }, "non_russian_summary"],
    [{ summary: "TODO placeholder" }, "placeholder_content"],
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
