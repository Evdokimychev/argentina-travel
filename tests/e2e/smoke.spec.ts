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
