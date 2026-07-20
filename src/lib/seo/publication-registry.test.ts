import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluateRuPublication,
  filterRuSitemapPaths,
  findRuUrlDecision,
  RU_URL_DECISIONS,
} from "@/lib/seo/publication-registry";

describe("RU SEO publication registry", () => {
  it("accepts only published, indexable and self-canonical candidates", () => {
    expect(
      evaluateRuPublication({
        path: "/places/salta",
        canonicalPath: "/places/salta",
        published: true,
        indexable: true,
      }),
    ).toMatchObject({ eligibleForSitemap: true, disposition: "index" });

    expect(
      evaluateRuPublication({
        path: "/places/salta-alias",
        canonicalPath: "/places/salta",
        published: true,
        indexable: true,
      }),
    ).toMatchObject({ eligibleForSitemap: false, reason: "not_self_canonical" });
    expect(
      evaluateRuPublication({
        path: "/places/draft",
        canonicalPath: "/places/draft",
        published: false,
        indexable: true,
      }),
    ).toMatchObject({ eligibleForSitemap: false, reason: "not_published" });
  });

  it("keeps locale fallback, noindex and unstable aliases out of sitemap", () => {
    expect(
      filterRuSitemapPaths([
        "/",
        "/es",
        "/en/blog/article",
        "/booking/find",
        "/baza-znaniy/poisk",
        "/immigration",
        "/immigration/vnzh-i-pmzh",
        "/excursions/city/Puerto_Iguazu",
        "/excursions/city/city-151",
        "/excursions/guide/470707",
        "/places/salta",
      ]),
    ).toEqual(["/", "/places/salta"]);
  });

  it("records canonical targets for resolved duplicate aliases", () => {
    expect(findRuUrlDecision("/baza-znaniy/ciudad-de-salta")).toMatchObject({
      disposition: "redirect",
      canonicalPath: "/baza-znaniy/salta",
    });
    expect(findRuUrlDecision("/baza-znaniy/parque-nacional-los-cardones")).toMatchObject({
      disposition: "redirect",
      canonicalPath: "/baza-znaniy/los-cardones",
    });
    expect(findRuUrlDecision("/excursions/city/city-151")).toMatchObject({
      disposition: "redirect",
      canonicalPath: "/excursions/city/Buenos_Aires",
    });
    expect(findRuUrlDecision("/excursions/city/Puerto_Iguazu")).toMatchObject({
      disposition: "redirect",
      canonicalPath: "/destinations/iguazu",
    });
    expect(findRuUrlDecision("/immigration/vnzh-i-pmzh")).toMatchObject({
      disposition: "noindex",
      reason: "editorial_quarantine",
    });
  });

  it("keeps permanent redirect configuration aligned with registry decisions", () => {
    const config = readFileSync(resolve(process.cwd(), "next.config.ts"), "utf8");
    const redirects = RU_URL_DECISIONS.filter((decision) => decision.disposition === "redirect");

    for (const redirect of redirects) {
      expect(config).toContain(`source: "${redirect.path}"`);
      expect(config).toContain(`destination: "${redirect.canonicalPath}"`);
      expect(config).toContain("permanent: true");
    }
  });
});
