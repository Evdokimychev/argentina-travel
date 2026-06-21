import { expect, test, type Page } from "@playwright/test";

async function expectHtmlPage(page: Page, pathname: string) {
  const response = await page.goto(pathname, { waitUntil: "domcontentloaded" });
  expect(response, `No response received for ${pathname}`).not.toBeNull();
  expect(response!.status(), `Unexpected status for ${pathname}`).toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();
}

test.describe("E100 public smoke", () => {
  test("home page renders", async ({ page }) => {
    await expectHtmlPage(page, "/");
  });

  test("tours catalog renders", async ({ page }) => {
    await expectHtmlPage(page, "/tours");
  });

  test("booking find page renders", async ({ page }) => {
    await expectHtmlPage(page, "/booking/find");
    await expect(page.getByRole("heading", { name: "Найти заявку" })).toBeVisible();
  });

  test("login entry route opens auth modal", async ({ page }) => {
    await expectHtmlPage(page, "/?auth=sign-in");
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("/api/health returns json payload", async ({ request }) => {
    const response = await request.get("/api/health");
    expect([200, 503]).toContain(response.status());

    const body = await response.json();
    expect(body).toEqual(expect.any(Object));
    expect(typeof body.ok).toBe("boolean");
    expect(typeof body.version).toBe("string");
    expect(typeof body.environment?.nodeEnv).toBe("string");
    expect(typeof body.environment?.deployEnv).toBe("string");
    expect(body.migrationVersion === null || typeof body.migrationVersion === "string").toBe(true);
  });
});

test.describe("I3 CMS cutover smoke", () => {
  test("blog cornerstone post renders", async ({ page }) => {
    await expectHtmlPage(page, "/blog/buenos-aires-rajony");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("rich park article renders", async ({ page }) => {
    await expectHtmlPage(page, "/blog/natsionalnyy-park-iguasu");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("guide page renders", async ({ page }) => {
    await expectHtmlPage(page, "/guide/sezony-i-klimat");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("destination page renders", async ({ page }) => {
    await expectHtmlPage(page, "/destinations/patagonia");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("place page renders", async ({ page }) => {
    await expectHtmlPage(page, "/places/iguazu-falls");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("legacy blog slug redirects to canonical", async ({ page }) => {
    const response = await page.goto("/blog/buenos-aires-neighborhoods", {
      waitUntil: "domcontentloaded",
    });
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/blog\/buenos-aires-rajony/);
  });
});
