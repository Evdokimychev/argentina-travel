import { expect, test } from "@playwright/test";

/** Dotted footer keys that must never appear as visible footer text in SSR HTML. */
const RAW_FOOTER_KEY = /\bfooter\.[a-zA-Z][\w.]*/g;

const PUBLIC_SSR_PATHS = ["/", "/tours", "/places", "/faq", "/en/tours", "/en/places"] as const;

function extractBreadcrumbJsonLdNames(pageHtml: string): string[] {
  const names: string[] = [];
  for (const match of pageHtml.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const block = JSON.parse(match[1].trim()) as {
        "@type"?: string;
        itemListElement?: Array<{ name?: string }>;
      };
      if (block["@type"] !== "BreadcrumbList") continue;
      for (const element of block.itemListElement ?? []) {
        if (element.name) names.push(element.name);
      }
    } catch {
      // ignore invalid JSON-LD blocks
    }
  }
  return names;
}

function extractFooterHtml(pageHtml: string): string {
  const match = pageHtml.match(
    /<footer[^>]*class="[^"]*site-footer-safe-area[^"]*"[^>]*>([\s\S]*?)<\/footer>/,
  );
  return match?.[1] ?? "";
}

test.describe("SSR i18n chrome", () => {
  test.describe.configure({ timeout: 120_000 });

  for (const path of PUBLIC_SSR_PATHS) {
    test(`${path} footer SSR does not expose raw footer.* keys`, async ({ request }) => {
      const response = await request.get(path, { timeout: 90_000 });
      expect(response.status(), `status for ${path}`).toBeLessThan(400);

      const html = await response.text();
      const footerHtml = extractFooterHtml(html);

      expect(footerHtml.length, `footer markup missing on ${path}`).toBeGreaterThan(0);

      const rawKeys = footerHtml.match(RAW_FOOTER_KEY) ?? [];
      expect(rawKeys, `raw footer i18n keys on ${path}`).toEqual([]);
    });
  }

  test("/en/places breadcrumb JSON-LD uses English labels", async ({ request }) => {
    const response = await request.get("/en/places", { timeout: 90_000 });
    expect(response.status()).toBeLessThan(400);

    const html = await response.text();
    const breadcrumbNames = extractBreadcrumbJsonLdNames(html);

    expect(breadcrumbNames.length).toBeGreaterThan(0);
    expect(breadcrumbNames).toContain("Home");
    expect(breadcrumbNames).not.toContain("Главная");
  });
});
