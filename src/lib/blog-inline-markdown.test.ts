import { describe, expect, it } from "vitest";
import {
  blogInlineMarkdownToHtml,
  hasBlogInlineMarkdown,
  stripBlogInlineMarkdown,
} from "@/lib/blog-inline-markdown";

describe("blog-inline-markdown", () => {
  it("detects and strips common markers", () => {
    expect(hasBlogInlineMarkdown("Регион **Мендоса**")).toBe(true);
    expect(stripBlogInlineMarkdown("Регион **Мендоса**")).toBe("Регион Мендоса");
    expect(stripBlogInlineMarkdown("[гид](https://example.com)")).toBe("гид");
  });

  it("formats emphasis and markdown links to safe HTML", () => {
    const html = blogInlineMarkdownToHtml("См. **Мальбек** и [гид](https://example.com/x)");
    expect(html).toContain("<strong>Мальбек</strong>");
    expect(html).toContain('href="https://example.com/x"');
    expect(html).toContain(">гид</a>");
    expect(html).not.toContain("<script");
  });
});
