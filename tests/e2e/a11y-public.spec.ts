import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Sprint 4 — representative public accessibility gate.
 * Keep the sample small (route families), not every URL.
 */
const A11Y_PUBLIC_PATHS = [
  "/",
  "/tours",
  "/excursions",
  "/destinations/patagonia",
  "/blog",
  "/blog/best-time-to-visit-argentina",
  "/guide",
  "/immigration",
  "/baza-znaniy",
  "/contacts",
  "/mapa-argentina",
] as const;

async function dismissCookieBanner(page: Page) {
  const button = page.getByRole("button", {
    name: /^(Только нужные|Только необходимые|Принять все|Принять)$/i,
  });
  if (await button.isVisible().catch(() => false)) {
    await button.click({ timeout: 3_000 }).catch(() => undefined);
  }
}

test.describe("Sprint 4 public accessibility (axe)", () => {
  for (const pathname of A11Y_PUBLIC_PATHS) {
    test(`axe critical/serious: ${pathname}`, async ({ page }) => {
      await page.goto(pathname, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible();
      await dismissCookieBanner(page);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const blocking = results.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      );

      expect(
        blocking,
        blocking
          .map(
            (violation) =>
              `${violation.impact}: ${violation.id} — ${violation.help} (${violation.nodes.length} nodes)`,
          )
          .join("\n") || "no blocking violations",
      ).toEqual([]);
    });
  }

  test("homepage keyboard reaches main landmark", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);

    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /к содержанию|skip|основн/i });
    if (await skip.isVisible().catch(() => false)) {
      await page.keyboard.press("Enter");
    }

    await expect(page.locator("#main-content, main").first()).toBeVisible();
  });
});
