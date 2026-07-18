import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import KbProvenance, {
  buildKbPublicProvenance,
  isKbSensitiveEntryStrictlyVerified,
} from "@/components/knowledge-base/KbProvenance";
import KbSources from "@/components/knowledge-base/KbSources";
import { renderMarkdown } from "@/lib/knowledge-base/markdown";
import type { KbEntry } from "@/lib/knowledge-base/types";

function strictEntry(): KbEntry {
  return {
    id: "entry-public",
    type: "guide",
    title: "Документы",
    body: "## Факты\n\n- Для подачи нужен действующий паспорт.",
    confidence: "high",
    sources: [
      {
        id: "internal-source-id",
        title: "Миграционная служба Аргентины",
        url: "https://www.argentina.gob.ar/interior/migraciones",
        authority: "primary",
        url_status: "verified",
        checked_at: "2026-07-17",
      },
    ],
    claims: [
      {
        id: "internal-claim-id",
        text: "Для подачи нужен действующий паспорт.",
        sensitive: true,
        source_ids: ["internal-source-id"],
        verified_at: "2026-07-17",
        reviewer: { id: "employee-42", role: "legal_editor" },
      },
    ],
    provenance: { schema_version: 1, mode: "strict" },
    editorial: {
      sensitive: true,
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
        stale_after_days: 90,
      },
    },
  };
}

describe("knowledge-base public provenance", () => {
  it("shows human-readable source markers and review details without internal ids", () => {
    const entry = strictEntry();
    const provenance = buildKbPublicProvenance(entry);
    const html = renderToStaticMarkup(<KbProvenance data={provenance} />);

    expect(provenance).not.toBeNull();
    expect(html).toContain("Как проверены ключевые факты");
    expect(html).toContain('href="#kb-source-1"');
    expect(html).toContain("17 июля 2026");
    expect(html).toContain("Редактор по правовым вопросам");
    expect(html).not.toContain("internal-source-id");
    expect(html).not.toContain("internal-claim-id");
    expect(html).not.toContain("employee-42");
  });

  it("adds a marker to a matching fact bullet", () => {
    const entry = strictEntry();
    const provenance = buildKbPublicProvenance(entry);
    const html = renderToStaticMarkup(
      renderMarkdown(entry.body, { validIds: new Set(), provenance }),
    );

    expect(html).toContain("Для подачи нужен действующий паспорт.");
    expect(html).toContain('aria-label="Источник 1: Миграционная служба Аргентины"');
  });

  it("fails closed when a claim points to an unknown source", () => {
    const entry = strictEntry();
    entry.claims = [{ ...entry.claims![0], source_ids: ["missing-source"] }];

    expect(buildKbPublicProvenance(entry)).toBeNull();
    expect(isKbSensitiveEntryStrictlyVerified(entry)).toBe(false);
  });

  it("fails closed when the reviewed claim is not present in the article", () => {
    const entry = strictEntry();
    entry.body = "## Факты\n\nСведения в статье изменились.";

    expect(buildKbPublicProvenance(entry)).toBeNull();
    expect(isKbSensitiveEntryStrictlyVerified(entry)).toBe(false);
  });

  it("does not treat diagnostic provenance as verification", () => {
    const entry = strictEntry();
    entry.editorial!.provenance = {
      ...entry.editorial!.provenance!,
      mode: "diagnostic",
      strict_ready: false,
      issue_count: 1,
      issue_codes: ["missing_sensitive_claim_mapping"],
    };

    expect(buildKbPublicProvenance(entry)).toBeNull();
    expect(isKbSensitiveEntryStrictlyVerified(entry)).toBe(false);
  });

  it("keeps a legacy source list useful without a review claim", () => {
    const entry = strictEntry();
    const html = renderToStaticMarkup(<KbSources sources={entry.sources} />);

    expect(html).toContain("Источники");
    expect(html).toContain("Миграционная служба Аргентины");
    expect(html).not.toContain("Проверено");
  });
});
