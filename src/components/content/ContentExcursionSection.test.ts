import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("ContentExcursionSection contract", () => {
  it("uses the canonical internal excursion card and never builds a raw partner URL", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/content/ContentExcursionSection.tsx"),
      "utf8",
    );
    const card = readFileSync(
      join(process.cwd(), "src/components/excursions/ExcursionCard.tsx"),
      "utf8",
    );
    expect(source).toContain("ExcursionCard");
    expect(source).toContain("Почему подходит");
    expect(source).not.toMatch(/experience\.tripster|sputnik8\.com|partnerUrl|bookingHref/);
    expect(card).toContain("/excursions/${excursion.slug}");
  });

  it("is wired only through server-side catalog fetching on blog and knowledge pages", () => {
    const blogPage = readFileSync(
      join(process.cwd(), "src/app/blog/[slug]/page.tsx"),
      "utf8",
    );
    const knowledgePage = readFileSync(
      join(process.cwd(), "src/app/baza-znaniy/[slug]/page.tsx"),
      "utf8",
    );
    const blogView = readFileSync(
      join(process.cwd(), "src/components/blog/BlogPostView.tsx"),
      "utf8",
    );
    const serverLoader = readFileSync(
      join(process.cwd(), "src/lib/content-excursions-server.ts"),
      "utf8",
    );
    expect(blogPage).toContain("fetchContentExcursionsServer");
    expect(blogPage).toContain("resolveExcursionsForBlogPost");
    expect(knowledgePage).toContain("fetchContentExcursionsServer");
    expect(knowledgePage).toContain("resolveExcursionsForKnowledgeEntry");
    expect(blogView).toContain("ContentExcursionSection");
    expect(serverLoader).toContain("fetchExcursionsServer");
    expect(serverLoader).toContain("CONTENT_EXCURSION_DEADLINE_MS");
  });
});
