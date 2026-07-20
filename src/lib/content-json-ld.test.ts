import { describe, expect, it } from "vitest";

import { buildKbEntryArticleJsonLd } from "@/lib/content-json-ld";
import type { KbEntry } from "@/lib/knowledge-base/types";

const entry: KbEntry = {
  id: "lichnyj-opyt",
  type: "author_tip",
  title: "Личный опыт",
  summary: "Практическая история автора.",
  status: "published",
  site_ready: true,
  body: "Подробный текст личной истории.",
};

describe("knowledge-base article JSON-LD", () => {
  it("uses a Person only for a verified personal author", () => {
    const personal = buildKbEntryArticleJsonLd({
      ...entry,
      author_name: "Иван",
      author_slug: "ivan",
      personal_experience: true,
      verified_by_ivan: true,
    });
    const unverified = buildKbEntryArticleJsonLd({
      ...entry,
      author_name: "Не подтверждён",
      author_slug: "unverified",
    });

    expect(personal.author).toMatchObject({
      "@type": "Person",
      name: "Иван",
      url: expect.stringContaining("/baza-znaniy/avtory/ivan"),
    });
    expect(unverified.author).toMatchObject({ "@type": "Organization" });
  });
});
