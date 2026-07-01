import { expect, test } from "@playwright/test";

/** Dotted footer keys that must never appear as visible footer text in SSR HTML. */
const RAW_FOOTER_KEY = /\bfooter\.[a-zA-Z][\w.]*/g;

const PUBLIC_SSR_PATHS = ["/", "/tours", "/places", "/faq", "/en/tours"] as const;

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
});
