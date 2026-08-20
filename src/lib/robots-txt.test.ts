import { describe, expect, it } from "vitest";
import {
  buildRobotsTxtBody,
  isCanonicalIndexingRequest,
  YANDEX_CLEAN_PARAMS,
} from "@/lib/robots-txt";

describe("robots-txt", () => {
  it("blocks entire site when indexing disabled", () => {
    const body = buildRobotsTxtBody(false);
    expect(body).toContain("User-agent: *");
    expect(body).toContain("Disallow: /");
    expect(body).not.toContain("Sitemap:");
  });

  it("includes disallow paths, sitemap and Yandex Clean-param when indexing enabled", () => {
    const body = buildRobotsTxtBody(true);
    expect(body).toContain("Disallow: /admin/");
    expect(body).toContain("Disallow: /baza-znaniy/poisk");
    expect(body).toContain("Disallow: /api/");
    expect(body).toContain("User-agent: Yandex");
    expect(body).toContain(`Clean-param: ${YANDEX_CLEAN_PARAMS}`);
    expect(body).toContain("Sitemap: https://www.goargentina.ru/sitemap.xml");
    expect(body).toContain("utm_source");
    expect(body).toContain("gclid");
  });

  it("allows indexing only on the canonical production host", () => {
    expect(
      isCanonicalIndexingRequest("https://www.goargentina.ru/tours", {
        NODE_ENV: "production",
        VERCEL_ENV: "production",
      }),
    ).toBe(true);
    expect(
      isCanonicalIndexingRequest("https://argentina-travel-git-seo.vercel.app/tours", {
        NODE_ENV: "production",
        VERCEL_ENV: "preview",
      }),
    ).toBe(false);
    expect(
      isCanonicalIndexingRequest("http://localhost:3000/tours", {
        NODE_ENV: "production",
      }),
    ).toBe(false);
  });
});
