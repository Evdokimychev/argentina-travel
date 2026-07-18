import test from "node:test";
import assert from "node:assert/strict";

import { isHealthyHttpStatus, selectSourceTargets } from "./kb-source-health.mjs";

test("accepts only successful and redirected HTTP responses", () => {
  assert.equal(isHealthyHttpStatus(200), true);
  assert.equal(isHealthyHttpStatus(308), true);
  assert.equal(isHealthyHttpStatus(403), false);
  assert.equal(isHealthyHttpStatus(500), false);
});

test("selects migrated sources by default and deduplicates URLs", () => {
  const content = {
    entities: [
      {
        id: "one",
        sources: [
          {
            id: "official-law",
            url: "https://example.gov/law",
            authority: "primary",
            checked_at: "2026-07-17",
            url_status: "verified",
          },
          { title: "legacy", url: "https://example.org/legacy" },
        ],
      },
      {
        id: "two",
        sources: [
          {
            id: "same-law",
            url: "https://example.gov/law",
            authority: "primary",
            checked_at: "2026-07-17",
            url_status: "verified",
          },
        ],
      },
    ],
  };

  const migrated = selectSourceTargets(content);
  assert.equal(migrated.length, 1);
  assert.equal(migrated[0].references.length, 2);
  assert.equal(selectSourceTargets(content, { includeLegacy: true }).length, 2);
});

test("ignores relative and non-http source references", () => {
  const content = {
    entities: [
      {
        id: "one",
        sources: [
          { id: "local", url: "../other.md", authority: "primary", checked_at: "2026-07-17" },
          { id: "mail", url: "mailto:test@example.com", authority: "primary", checked_at: "2026-07-17" },
        ],
      },
    ],
  };
  assert.deepEqual(selectSourceTargets(content), []);
});
